import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// Defense stocks and relevant market indices via Yahoo Finance (free, no key)
export async function GET() {
  const symbols = [
    { symbol: 'LMT', name: 'Lockheed Martin' },
    { symbol: 'RTX', name: 'Raytheon' },
    { symbol: 'NOC', name: 'Northrop Grumman' },
    { symbol: 'BA', name: 'Boeing' },
    { symbol: 'GD', name: 'General Dynamics' },
    { symbol: 'LHX', name: 'L3Harris' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^VIX', name: 'VIX (Fear Index)' },
    { symbol: 'GC=F', name: 'Gold' },
    { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
  ];

  const results = await Promise.allSettled(
    symbols.map(async ({ symbol, name }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
        const res = await fetchWithTimeout(url, { timeout: 8000 });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const meta = data.chart.result[0].meta;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const price = meta.regularMarketPrice;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return {
          symbol,
          name,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      } catch {
        return { symbol, name, price: 0, change: 0, changePercent: 0, error: true };
      }
    })
  );

  const markets = results
    .filter((r): r is PromiseFulfilledResult<{ symbol: string; name: string; price: number; change: number; changePercent: number }> =>
      r.status === 'fulfilled'
    )
    .map(r => r.value);

  return NextResponse.json(markets, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
  });
}
