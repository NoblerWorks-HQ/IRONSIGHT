import { NextResponse } from 'next/server';
import { translateFreeText } from '@/lib/hebrew';
import { getConflictFromRequest } from '@/lib/conflicts';
import { extractTelegramText } from '@/lib/telegramText';

// Detect non-Latin scripts (Hebrew, Arabic, Farsi, Cyrillic, etc.)
function hasNonLatinText(text: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0400-\u04FF]/.test(text);
}

export const dynamic = 'force-dynamic';

// Scrape public Telegram channels via embed endpoint
// Completely free, no API key, no bot needed
// Channel list is per-conflict (see src/lib/conflicts/*).

interface TelegramPost {
  channel: string;
  channelLabel: string;
  color: string;
  postId: number;
  text: string;
  date: string;
  url: string;
}

// Persist latest known post IDs across requests (in-memory cache)
const latestKnownIds: Record<string, number> = {};
// Cache of fetched posts so we don't re-fetch. Bounded: oldest entries are
// evicted first (Map keeps insertion order) so a long-running container
// does not grow without limit.
const POST_CACHE_MAX = 5000;
const postCache = new Map<string, { text: string; date: string }>();

async function fetchPost(channel: string, postId: number): Promise<{ text: string; date: string } | null> {
  const cacheKey = `${channel}/${postId}`;
  const cached = postCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://t.me/${channel}/${postId}?embed=1&mode=tme`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const extracted = extractTelegramText(html);
    if (!extracted) return null;
    let text = extracted;

    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Auto-translate non-Latin text (Hebrew, Farsi, Arabic, etc.)
    if (hasNonLatinText(text)) {
      text = await translateFreeText(text);
    }

    const result = { text, date };
    postCache.set(cacheKey, result);
    if (postCache.size > POST_CACHE_MAX) {
      const oldest = postCache.keys().next().value;
      if (oldest !== undefined) postCache.delete(oldest);
    }
    return result;
  } catch {
    return null;
  }
}
import fs from 'fs';
import path from 'path';

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'telegram_state.json');

function loadTelegramState(): Record<string, number> {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error("[Telegram API] Failed to read state:", e);
  }
  return {};
}

function saveTelegramState(state: Record<string, number>) {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
    console.error("[Telegram API] Failed to write state:", e);
  }
}

// Initialize global request counter and load persisted state from disk
let totalRequestsMade = 0;
const persistedState = loadTelegramState();


// On first call, find latest post via binary search. After that, just check ahead.
async function findLatestPostId(channel: string): Promise<number> {
  // Enforce a strict request budget
  const MAX_REQUESTS = Number(process.env.MAX_TELEGRAM_REQUESTS_PER_CALL) || 200;

  // Use persisted disk state if process memory is blank (cold start)
  if (!latestKnownIds[channel] && persistedState[channel]) {
    latestKnownIds[channel] = persistedState[channel];
  }

  const known = latestKnownIds[channel];

  if (known) {
    // Gracefully stop dispatching network calls if budget is exhausted
    if (totalRequestsMade >= MAX_REQUESTS) {
      console.warn(`[Telegram API] Request budget limit of ${MAX_REQUESTS} reached. Skipping channel: ${channel}`);
      return known;
    }

    // Track scheduled network requests against safety budget ceiling
    totalRequestsMade += 20;

    // Check up to 20 ahead in parallel for new posts
    const checks = Array.from({ length: 20 }, (_, i) => known + 20 - i);
    const results = await Promise.allSettled(
      checks.map(id => fetchPost(channel, id).then(r => r ? id : null))
    );

    let highest = known;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && r.value > highest) {
        highest = r.value;
      }
    }

    latestKnownIds[channel] = highest;

    // Persist the newly discovered high-water mark to disk immediately
    persistedState[channel] = highest;
    saveTelegramState(persistedState);

    return highest;
  }

  // First time: binary search (sequential but fast with big jumps)
  let low = 1;
  let high = 200000;

  // Quick probe to find rough range
  for (const probe of) {
    if (probe >= high) break;
    
    if (totalRequestsMade >= MAX_REQUESTS) break;
    totalRequestsMade++;

    const result = await fetchPost(channel, probe);
    if (result) {
      low = probe;
    } else {
      high = probe;
      break;
    }
  }

  // Binary search
  while (high - low > 10) {
    if (totalRequestsMade >= MAX_REQUESTS) break;
    totalRequestsMade++;

    const mid = Math.floor((low + high) / 2);
    const result = await fetchPost(channel, mid);
    if (result) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Fine scan the last few
  for (let i = high; i >= low; i--) {
    if (totalRequestsMade >= MAX_REQUESTS) break;
    totalRequestsMade++;

    const result = await fetchPost(channel, i);
    if (result) {
      latestKnownIds[channel] = i;

      // Persist the newly discovered high-water mark to disk immediately
      persistedState[channel] = i;
      saveTelegramState(persistedState);

      return i;
    }
  }

  latestKnownIds[channel] = low;

  // Persist the newly discovered high-water mark to disk immediately
  persistedState[channel] = low;
  saveTelegramState(persistedState);

  return low;
}
