import { NextResponse } from 'next/server';
import { fetchWithTimeout, parseXML, getTextContent } from '@/lib/fetcher';
import type { ConflictEvent } from '@/types';

export const dynamic = 'force-dynamic';

// Two Google News queries: general conflict + specific strike locations
export async function GET() {
  const queries = [
    'Iran Israel war military conflict strike attack',
    'missile OR rocket OR drone strike OR attack Arad OR Dimona OR "Tel Aviv" OR Haifa OR Eilat OR Tehran OR Isfahan OR Beirut OR "South Pars" OR Natanz OR "Diego Garcia"',
  ];

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

        let location = 'Middle East';
        if (t.includes('arad')) location = 'Arad, Israel';
        else if (t.includes('dimona') || t.includes('nuclear town')) location = 'Dimona, Israel';
        else if (t.includes('tel aviv')) location = 'Tel Aviv, Israel';
        else if (t.includes('haifa')) location = 'Haifa, Israel';
        else if (t.includes('eilat')) location = 'Eilat, Israel';
        else if (t.includes('ashkelon')) location = 'Ashkelon, Israel';
        else if (t.includes('ashdod')) location = 'Ashdod, Israel';
        else if (t.includes('negev')) location = 'Negev, Israel';
        else if (t.includes('natanz')) location = 'Natanz, Iran';
        else if (t.includes('isfahan')) location = 'Isfahan, Iran';
        else if (t.includes('tehran')) location = 'Tehran, Iran';
        else if (t.includes('south pars')) location = 'South Pars, Iran';
        else if (t.includes('bushehr')) location = 'Bushehr, Iran';
        else if (t.includes('tabriz')) location = 'Tabriz, Iran';
        else if (t.includes('beirut')) location = 'Beirut, Lebanon';
        else if (t.includes('lebanon')) location = 'Lebanon';
        else if (t.includes('damascus')) location = 'Damascus, Syria';
        else if (t.includes('syria')) location = 'Syria';
        else if (t.includes('baghdad')) location = 'Baghdad, Iraq';
        else if (t.includes('iraq')) location = 'Iraq';
        else if (t.includes('diego garcia')) location = 'Diego Garcia';
        else if (t.includes('qatar') || t.includes('doha')) location = 'Qatar';
        else if (t.includes('kuwait')) location = 'Kuwait';
        else if (t.includes('saudi')) location = 'Saudi Arabia';
        else if (t.includes('yemen') || t.includes('houthi')) location = 'Yemen';
        else if (t.includes('gaza')) location = 'Gaza';
        else if (t.includes('israel')) location = 'Israel';
        else if (t.includes('iran')) location = 'Iran';

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
