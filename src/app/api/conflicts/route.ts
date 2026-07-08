import { NextResponse } from 'next/server';
import { fetchWithTimeout, parseXML, getTextContent } from '@/lib/fetcher';
import { getConflictFromRequest } from '@/lib/conflicts';
import type { ConflictEvent } from '@/types';

export const dynamic = 'force-dynamic';

// Two Google News queries: general conflict + specific strike locations
export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  const queries = server.conflictQueries;

  const allEvents: ConflictEvent[] = [];
  const seenTitles = new Set<string>();

  const results = await Promise.allSettled(
    queries.map(async (query) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetchWithTimeout(url, { timeout: 8000 });
      if (!res.ok) return [];

      const text = await res.text();
      const doc = parseXML(text);
      const items = doc.getElementsByTagName('item');
      const events: ConflictEvent[] = [];

      for (let i = 0; i < Math.min(items.length, 25); i++) {
        const item = items[i];
        let title = getTextContent(item, 'title');
        const pubDate = getTextContent(item, 'pubDate');

        const dashIdx = title.lastIndexOf(' - ');
        const source = dashIdx > 0 ? title.substring(dashIdx + 3) : 'Google News';
        if (dashIdx > 0) title = title.substring(0, dashIdx);

        // Dedup
        const key = title.toLowerCase().trim().substring(0, 50);
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);

        const t = title.toLowerCase();
        let type = 'REPORT';
        if (t.match(/missile|strike|attack|bomb|airstrike|struck|hit|shell|rocket fire/)) type = 'STRIKE';
        else if (t.match(/intercept|iron dome|defense|defend|shoot down/)) type = 'DEFENSE';
        else if (t.match(/troop|deploy|military|soldier|force/)) type = 'MILITARY';
        else if (t.match(/sanction|diplomacy|negotiat|ceasefire|talk/)) type = 'DIPLOMATIC';
        else if (t.match(/nuclear|enrichment|iaea|uranium/)) type = 'NUCLEAR';
        else if (t.match(/drone|uav|shahed/)) type = 'DRONE';

        let location = server.defaultCountry;
        for (const rule of server.conflictLocations) {
          if (rule.match.some(m => t.includes(m))) { location = rule.location; break; }
        }

        events.push({
          id: `gn-${allEvents.length + events.length}-${Date.now()}`,
          date: pubDate || new Date().toISOString(),
          type,
          location,
          lat: 0,
          lon: 0,
          description: title,
          source,
        });
      }
      return events;
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') allEvents.push(...r.value);
  }

  // Sort newest first
  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json(allEvents, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
