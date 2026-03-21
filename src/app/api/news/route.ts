import { NextResponse } from 'next/server';
import { fetchWithTimeout, parseXML, getTextContent } from '@/lib/fetcher';
import { isHebrew, translateFreeText } from '@/lib/hebrew';
import type { NewsItem } from '@/types';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

const RSS_FEEDS = [
  // Wire Services & Major Outlets
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC', color: '#bb1919' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', source: 'NYT', color: '#1a1a1a' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', color: '#d4a843' },
  { url: 'https://feeds.reuters.com/Reuters/worldNews', source: 'Reuters', color: '#ff6600' },

  // Israeli Media
  { url: 'https://www.timesofisrael.com/feed/', source: 'Times of Israel', color: '#0066cc' },
  { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', source: 'JPost', color: '#003366' },
  { url: 'https://www.ynetnews.com/Integration/StoryRss2.xml', source: 'Ynet', color: '#f44336' },
  { url: 'https://rcs.mako.co.il/rss/news-military.xml', source: 'N12', color: '#e91e63' },
  { url: 'https://rss.walla.co.il/feed/22', source: 'Walla', color: '#ff5722' },

  // GCC / Gulf
  { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', source: 'The National', color: '#1a6b3c' },

  // US Major
  { url: 'http://rss.cnn.com/rss/edition_meast.rss', source: 'CNN', color: '#cc0000' },
  { url: 'https://moxie.foxnews.com/google-publisher/world.xml', source: 'Fox News', color: '#003366' },
  { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', source: 'WSJ', color: '#0274b6' },

  // Google News aggregated (catches everything fast)
  { url: 'https://news.google.com/rss/search?q=Iran+Israel+war+military&hl=en-US&gl=US&ceid=US:en', source: 'Google News', color: '#4285f4' },
  { url: 'https://news.google.com/rss/search?q=Iran+missile+strike+drone&hl=en-US&gl=US&ceid=US:en', source: 'Google News', color: '#4285f4' },
  { url: 'https://news.google.com/rss/search?q=%22Strait+of+Hormuz%22+OR+%22Red+Sea%22+military&hl=en-US&gl=US&ceid=US:en', source: 'Google News', color: '#4285f4' },

  // Defense & Military
  { url: 'https://breakingdefense.com/feed/', source: 'Breaking Def', color: '#cc0000' },
  { url: 'https://www.longwarjournal.org/feed', source: 'Long War Jrnl', color: '#556b2f' },
  { url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml', source: 'Mil Times', color: '#8b0000' },
  { url: 'https://warontherocks.com/feed/', source: 'War on Rocks', color: '#2e4057' },
  { url: 'https://www.centcom.mil/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=808&max=20', source: 'CENTCOM', color: '#4b5320' },

  // CENTCOM / DoD
  { url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', source: 'DoD', color: '#003366' },

  // Israeli Media (additional)
  { url: 'https://www.haaretz.com/srv/haaretz-latest-headlines', source: 'Haaretz', color: '#2a7fff' },
  { url: 'https://www.haaretz.com/srv/middle-east-news-rss', source: 'Haaretz', color: '#2a7fff' },

  // Independent
  { url: 'https://www.dropsitenews.com/feed', source: 'Drop Site', color: '#e63946' },

  // Iranian Media
  { url: 'https://www.presstv.ir/rss.xml', source: 'PressTV', color: '#00a650' },
  { url: 'https://www.presstv.ir/rss/rss-102.xml', source: 'PressTV', color: '#00a650' },
  { url: 'https://www.presstv.ir/rss/rss-101.xml', source: 'PressTV', color: '#00a650' },
];

// Sources whose feeds are already scoped to the conflict — no filtering needed
const UNFILTERED_SOURCES = new Set([
  'Times of Israel', 'JPost', 'Ynet', 'N12', 'Walla', 'Haaretz',
  'PressTV', 'Google News', 'CENTCOM', 'DoD',
  'BBC', 'NYT', // Already Middle East section feeds
]);

// Keywords to match for broad/world feeds (case-insensitive)
const RELEVANCE_KEYWORDS = /iran|israel|idf|irgc|hezbollah|hamas|houthi|lebanon|gaza|tehran|tel\s?aviv|jerusalem|yemen|iraq|syria|gulf|hormuz|red\s?sea|missile|strike|interception|nuclear|sanction|centcom|pentagon|middle\s?east|west\s?bank|golan|sinai|negev|dimona|natanz|isfahan|khamenei|netanyahu|nasrallah|raisi|ayatollah|mossad|shin\s?bet|quds|basij|proxy|ceasefire|escalat|retaliat|iron\s?dome|arrow|david.s\s?sling|patriot|drone|uav|saudi|emirates|uae|bahrain|qatar|kuwait|oman|gcc|opec/i;

function isRelevant(item: NewsItem): boolean {
  if (UNFILTERED_SOURCES.has(item.source)) return true;
  return RELEVANCE_KEYWORDS.test(item.title) || RELEVANCE_KEYWORDS.test(item.category || '');
}

async function fetchRSS(feedUrl: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout(feedUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'IronSight/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
    });
    if (!res.ok) return [];
    const text = await res.text();

    // Skip if response is HTML (not RSS)
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) return [];

    const doc = parseXML(text);
    const items = doc.getElementsByTagName('item');

    // Also check for Atom feeds
    const entries = doc.getElementsByTagName('entry');
    const elements = items.length > 0 ? items : entries;

    const results: NewsItem[] = [];

    for (let i = 0; i < Math.min(elements.length, 15); i++) {
      const item = elements[i];

      let title = getTextContent(item, 'title');
      let link = getTextContent(item, 'link');
      let pubDate = getTextContent(item, 'pubDate') || getTextContent(item, 'published') || getTextContent(item, 'updated');

      // For Atom feeds, link is in href attribute
      if (!link) {
        const linkEl = item.getElementsByTagName('link')[0];
        if (linkEl) link = linkEl.getAttribute('href') || '';
      }

      if (!title) continue;

      // Dedupe Google News titles that include " - Source" suffix
      if (source === 'Google News') {
        const dashIdx = title.lastIndexOf(' - ');
        if (dashIdx > 0) {
          title = title.substring(0, dashIdx);
        }
      }

      results.push({
        title,
        link,
        source,
        pubDate,
        category: getTextContent(item, 'category') || undefined,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchRSS(feed.url, feed.source))
  );

  const allNews: NewsItem[] = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(isRelevant);

  // Translate Hebrew titles to English
  const hebrewItems = allNews.filter(item => isHebrew(item.title));
  if (hebrewItems.length > 0) {
    const translations = await Promise.allSettled(
      hebrewItems.map(item => translateFreeText(item.title))
    );
    translations.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value !== hebrewItems[i].title) {
        hebrewItems[i].title = result.value;
      }
    });
  }

  // Deduplicate by title similarity (exact match after lowercasing)
  const seen = new Set<string>();
  const deduped = allNews.filter(item => {
    const key = item.title.toLowerCase().trim().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by closest to now first (handles RSS feeds with future timestamps)
  const now = Date.now();
  deduped.sort((a, b) => {
    const distA = Math.abs(now - new Date(a.pubDate || 0).getTime());
    const distB = Math.abs(now - new Date(b.pubDate || 0).getTime());
    return distA - distB;
  });

  return NextResponse.json(deduped.slice(0, 100), {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
