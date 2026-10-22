import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

const SYMBOLS = [
  { symbol: 'LMT', name: 'Lockheed Martin' },
  { symbol: 'RTX', name: 'Raytheon' },
  { symbol: 'NOC', name: 'Northrop Grumman' },
  { symbol: 'BA', name: 'Boeing' },
  { symbol: 'GD', name: 'General Dynamics' },
  { symbol: 'LHX', name: 'L3Harris' },
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^VIX', name: 'VIX (Fear Index)' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
];

async function fetchYahoo(sym: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
  const res = await fetchWithTimeout(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error('Failed');
  const data = await res.json();
  return data?.chart?.result?.[0]?.meta;
}

export async function GET() {
  try {
    const markets = await Promise.all(
      SYMBOLS.map(async (s) => {
        try {
          const meta = await fetchYahoo(s.symbol);
          if (!meta) throw new Error('No data');

          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
          const change = Math.round((price - prev) * 100) / 100;
          const pct = prev ? Math.round(((price - prev) / prev) * 10000) / 100 : 0;

          return {
            symbol: s.symbol,
            name: s.name,
            price: Math.round(price * 100) / 100,
            change,
            changePercent: pct,
          };
        } catch {
          return {
            symbol: s.symbol,
            name: s.name,
            price: 0,
            change: 0,
            changePercent: 0,
            error: true,
          };
        }
      })
    );

    return NextResponse.json(markets, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
