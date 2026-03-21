import { NextResponse } from 'next/server';
import { fetchWithTimeout, parseXML, getTextContent } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// Strike tracker using Google News RSS
export async function GET() {
  const strikes: StrikeEvent[] = [];

  const queries = [
    'Iran+OR+Israel+missile+strike+OR+airstrike+OR+intercept',
    'Iran+OR+Israel+drone+attack+OR+rocket+launch',
  ];

  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetchWithTimeout(url, { timeout: 8000 });
      if (!res.ok) continue;

      const text = await res.text();
      const doc = parseXML(text);
      const items = doc.getElementsByTagName('item');

      for (let i = 0; i < Math.min(items.length, 15); i++) {
        const item = items[i];
        let title = getTextContent(item, 'title');
        const pubDate = getTextContent(item, 'pubDate');
        const link = getTextContent(item, 'link');

        const dashIdx = title.lastIndexOf(' - ');
        const source = dashIdx > 0 ? title.substring(dashIdx + 3) : '';
        if (dashIdx > 0) title = title.substring(0, dashIdx);

        const t = title.toLowerCase();
        let category = 'REPORT';
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

        if (t.match(/intercept|iron dome|shoot down|arrow|david.s sling/)) {
          category = 'INTERCEPTION'; severity = 'high';
        } else if (t.match(/missile|ballistic/)) {
          category = 'MISSILE'; severity = 'critical';
        } else if (t.match(/drone|uav|shahed/)) {
          category = 'DRONE'; severity = 'high';
        } else if (t.match(/airstrike|air strike|bombing|bomb/)) {
          category = 'AIRSTRIKE'; severity = 'critical';
        } else if (t.match(/rocket/)) {
          category = 'ROCKET'; severity = 'high';
        } else if (t.match(/strike|attack/)) {
          category = 'STRIKE'; severity = 'medium';
        }

        let country = 'Middle East';
        if (t.includes('iran') || t.includes('tehran')) country = 'Iran';
        else if (t.includes('israel')) country = 'Israel';
        else if (t.includes('lebanon')) country = 'Lebanon';
        else if (t.includes('syria')) country = 'Syria';
        else if (t.includes('yemen') || t.includes('houthi')) country = 'Yemen';

        strikes.push({
          id: `strike-${strikes.length}-${Date.now()}`,
          date: pubDate || new Date().toISOString(),
          category, severity, title, source, url: link, country,
        });
      }
    } catch { continue; }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = strikes.filter(s => {
    const key = s.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json(deduped.slice(0, 25), {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}

interface StrikeEvent {
  id: string;
  date: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  source: string;
  url: string;
  country: string;
}
