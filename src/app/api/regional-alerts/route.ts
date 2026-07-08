import { NextResponse } from 'next/server';
import { fetchWithTimeout, parseXML, getTextContent } from '@/lib/fetcher';
import { getConflictFromRequest } from '@/lib/conflicts';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// Severity scoring based on title content
const CRITICAL_TERMS = [
  'killed', 'dead', 'deaths', 'casualties', 'massacre',
  'struck', 'hits', 'bombs', 'bombing', 'bombard',
  'invasion', 'invade', 'ground operation',
  'siren', 'air raid', 'take shelter', 'incoming',
  'nuclear', 'chemical',
];

const HIGH_TERMS = [
  'strike', 'airstrike', 'air strike', 'missile',
  'attack', 'attacked', 'intercept', 'shoot down',
  'explosion', 'blast', 'destroyed', 'damage',
  'drone', 'rocket', 'shell', 'artillery',
  'deploy', 'mobilize', 'escalat',
];

const MEDIUM_TERMS = [
  'military', 'troops', 'forces', 'war',
  'conflict', 'tension', 'threaten', 'warn',
  'airspace', 'no-fly', 'evacuate',
  'defense', 'defence',
  'ceasefire', 'negotiate',
];

function scoreSeverity(title: string): 'critical' | 'high' | 'medium' | 'low' {
  const t = title.toLowerCase();
  if (CRITICAL_TERMS.some(kw => t.includes(kw))) return 'critical';
  if (HIGH_TERMS.some(kw => t.includes(kw))) return 'high';
  if (MEDIUM_TERMS.some(kw => t.includes(kw))) return 'medium';
  return 'low';
}

function getAlertLevel(events: { severity: string; hoursAgo: number }[]): 'CLEAR' | 'MONITORING' | 'ALERT' | 'CRITICAL' {
  // Only consider events from last 12 hours for alert level
  const recent = events.filter(e => e.hoursAgo < 12);
  if (recent.some(e => e.severity === 'critical')) return 'CRITICAL';
  if (recent.some(e => e.severity === 'high')) return 'ALERT';
  if (recent.length > 0) return 'MONITORING';
  // If we have events but they're older, still show monitoring
  if (events.length > 0) return 'MONITORING';
  return 'CLEAR';
}

interface CountryEvent {
  title: string;
  source: string;
  time: string;
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hoursAgo: number;
}

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  const countryQueries = server.countryQueries.map(c => ({ name: c.country, flag: c.flag, query: c.query }));

  // Fetch 3 countries at a time to avoid rate limiting Google
  const results: { name: string; flag: string; events: CountryEvent[]; level: string }[] = [];

  // Process in batches of 3
  for (let i = 0; i < countryQueries.length; i += 3) {
    const batch = countryQueries.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(async (country) => {
        const url = `https://news.google.com/rss/search?q=${country.query}&hl=en-US&gl=US&ceid=US:en`;
        try {
          const res = await fetchWithTimeout(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'IronSight/1.0', 'Accept': 'application/rss+xml, text/xml, */*' },
          });
          if (!res.ok) return { ...country, events: [] };

          const text = await res.text();
          const doc = parseXML(text);
          const items = doc.getElementsByTagName('item');
          const events: CountryEvent[] = [];
          const now = Date.now();

          for (let j = 0; j < Math.min(items.length, 8); j++) {
            const item = items[j];
            let title = getTextContent(item, 'title');
            const link = getTextContent(item, 'link');
            const pubDate = getTextContent(item, 'pubDate');

            // Strip Google News source suffix
            const dashIdx = title.lastIndexOf(' - ');
            const source = dashIdx > 0 ? title.substring(dashIdx + 3) : 'Google News';
            if (dashIdx > 0) title = title.substring(0, dashIdx);

            const pubTime = new Date(pubDate).getTime();
            const hoursAgo = (now - pubTime) / (1000 * 60 * 60);

            events.push({
              title,
              source,
              time: pubDate,
              url: link,
              severity: scoreSeverity(title),
              hoursAgo: Math.round(hoursAgo * 10) / 10,
            });
          }

          return { ...country, events };
        } catch {
          return { ...country, events: [] };
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        const c = r.value;
        results.push({
          name: c.name,
          flag: c.flag,
          events: c.events,
          level: getAlertLevel(c.events),
        });
      }
    }
  }

  // Sort: most active first
  const levelOrder: Record<string, number> = { CRITICAL: 0, ALERT: 1, MONITORING: 2, CLEAR: 3 };
  results.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3));

  return NextResponse.json({
    alerts: results,
    updated: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
