import { NextResponse } from 'next/server';
import { translateFreeText } from '@/lib/hebrew';

// Detect non-Latin scripts (Hebrew, Arabic, Farsi, Cyrillic, etc.)
function hasNonLatinText(text: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0400-\u04FF]/.test(text);
}

export const dynamic = 'force-dynamic';

// Scrape public Telegram channels via embed endpoint
// Completely free, no API key, no bot needed

const CHANNELS = [
  { name: 'IDFofficial', label: 'IDF Official', color: '#3388ff' },
  { name: 'RocketAlert', label: 'Rocket Alert', color: '#ff3366' },
  { name: 'PressTV', label: 'PressTV (Iran)', color: '#cc3333' },
  { name: 'OSINTdefender', label: 'OSINT Defender', color: '#00aaff' },
  { name: 'middle_east_spectator', label: 'ME Spectator', color: '#ff6600' },
  { name: 'iranintl_en', label: 'Iran Intl', color: '#00ff88' },
  { name: 'Alertisrael', label: 'Alert Israel', color: '#ff6688' },
  { name: 'QudsNen', label: 'Quds News', color: '#33cc66' },
  { name: 'TimesofIsrael', label: 'Times of Israel', color: '#0066cc' },
  { name: 'FarsNews_EN', label: 'Fars News', color: '#669933' },
  { name: 'FotrosResistancee', label: 'Fotros Resist.', color: '#dd4444' },
  { name: 'Alsaa_plus_EN', label: 'Al-Saa EN', color: '#ee8833' },
  { name: 'warfareanalysis', label: 'Warfare Analysis', color: '#8888cc' },
  { name: 'rnintel', label: 'RN Intel', color: '#44aacc' },
  { name: 'GeoPWatch', label: 'GeoPol Watch', color: '#cc66aa' },
  { name: 'thecradlemedia', label: 'The Cradle', color: '#aa8844' },
  { name: 'Middle_East_Spectator', label: 'ME Spectator 2', color: '#ff8844' },
  { name: 'HAMASW', label: 'Hamas-Israel War', color: '#339933' },
  { name: 'TasnimNewsEN', label: 'Tasnim News', color: '#557733' },
  { name: 'AbuAliExpress', label: 'Abu Ali Express', color: '#dd7733' },
  { name: 'dropsitenews', label: 'Drop Site News', color: '#e63946' },
  { name: 'france24_en', label: 'France 24', color: '#2266bb' },
  { name: 'SaberinFa', label: 'Saberin (IRGC)', color: '#884422' },
  { name: 'defapress_ir', label: 'DefaPress (Iran MOD)', color: '#556644' },
  { name: 'sepah', label: 'IRGC Official', color: '#774433' },
  { name: 'wamnews_en', label: 'WAM (UAE)', color: '#c4a535' },
  { name: 'gulfnewsUAE', label: 'Gulf News', color: '#e6b800' },
];

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
// Cache of fetched posts so we don't re-fetch
const postCache: Record<string, { text: string; date: string }> = {};

async function fetchPost(channel: string, postId: number): Promise<{ text: string; date: string } | null> {
  const cacheKey = `${channel}/${postId}`;
  if (postCache[cacheKey]) return postCache[cacheKey];

  try {
    const res = await fetch(`https://t.me/${channel}/${postId}?embed=1&mode=tme`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const textMatch = html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>(.*?)<\/div>/s);
    if (!textMatch) return null;

    let text = textMatch[1]
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#036;/g, '$')
      .replace(/\s+/g, ' ')
      .trim();

    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    if (!text) return null;

    // Auto-translate non-Latin text (Hebrew, Farsi, Arabic, etc.)
    if (hasNonLatinText(text)) {
      text = await translateFreeText(text);
    }

    const result = { text, date };
    postCache[cacheKey] = result;
    return result;
  } catch {
    return null;
  }
}

// On first call, find latest post via binary search. After that, just check ahead.
async function findLatestPostId(channel: string): Promise<number> {
  const known = latestKnownIds[channel];

  if (known) {
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
    return highest;
  }

  // First time: binary search (sequential but fast with big jumps)
  let low = 1;
  let high = 200000;

  // Quick probe to find rough range
  for (const probe of [500, 5000, 15000, 30000, 50000, 80000, 120000, 180000]) {
    if (probe >= high) break;
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
    const result = await fetchPost(channel, i);
    if (result) {
      latestKnownIds[channel] = i;
      return i;
    }
  }

  latestKnownIds[channel] = low;
  return low;
}

export async function GET() {
  // Process ALL channels in parallel — each finds latest + fetches 3 posts
  const channelResults = await Promise.allSettled(
    CHANNELS.map(async (channel) => {
      const latestId = await findLatestPostId(channel.name);
      const posts: TelegramPost[] = [];

      // Fetch only latest 3 posts in parallel
      const ids = [latestId, latestId - 1, latestId - 2].filter(id => id > 0);
      const results = await Promise.allSettled(
        ids.map(id => fetchPost(channel.name, id))
      );

      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          posts.push({
            channel: channel.name,
            channelLabel: channel.label,
            color: channel.color,
            postId: ids[i],
            text: r.value.text,
            date: r.value.date,
            url: `https://t.me/${channel.name}/${ids[i]}`,
          });
        }
      });

      return posts;
    })
  );

  const allPosts: TelegramPost[] = [];
  for (const result of channelResults) {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value);
    }
  }

  // Sort newest first
  allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    posts: allPosts,
    channels: CHANNELS.map(c => c.label),
    updated: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
