import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// CNBC public quote API — no API key, supports batch queries
const CNBC_SYMBOLS = 'LMT|RTX|NOC|BA|GD|LHX|.SPX|.DJI|.VIX|%40GC.1|%40DX.1';

// Map CNBC symbols to display symbols/names the panel expects
const SYMBOL_MAP: Record<string, { symbol: string; name: string }> = {
  'LMT': { symbol: 'LMT', name: 'Lockheed Martin' },
  'RTX': { symbol: 'RTX', name: 'Raytheon' },
  'NOC': { symbol: 'NOC', name: 'Northrop Grumman' },
  'BA': { symbol: 'BA', name: 'Boeing' },
  'GD': { symbol: 'GD', name: 'General Dynamics' },
  'LHX': { symbol: 'LHX', name: 'L3Harris' },
  '.SPX': { symbol: '^GSPC', name: 'S&P 500' },
  '.DJI': { symbol: '^DJI', name: 'Dow Jones' },
  '.VIX': { symbol: '^VIX', name: 'VIX (Fear Index)' },
  '@GC.1': { symbol: 'GC=F', name: 'Gold' },
  '@DX.1': { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
};

export async function GET() {
  try {
    const url = `https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=${CNBC_SYMBOLS}&requestMethod=itv&noCache=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`;

    const res = await fetchWithTimeout(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const quotes = data?.FormattedQuoteResult?.FormattedQuote || [];

    const markets = quotes
      .filter((q: Record<string, string>) => q.last && q.last !== '0')
      .map((q: Record<string, string>) => {
        const mapped = SYMBOL_MAP[q.symbol];
        const price = parseFloat((q.last || '0').replace(/,/g, ''));
        const change = parseFloat((q.change || '0').replace(/,/g, ''));
        const pct = parseFloat((q.change_pct || '0').replace(/[,%]/g, ''));

        return {
          symbol: mapped?.symbol || q.symbol,
          name: mapped?.name || q.shortName || q.name,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(pct * 100) / 100,
        };
      });

    return NextResponse.json(markets, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
