import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// Uses free commodities data from multiple sources
export async function GET() {
  try {
    // Primary: frankfurter.app doesn't have commodities, so we use a GDELT-based approach
    // and free financial data APIs

    // Try fetching from Yahoo Finance (public endpoint, no key needed)
    const symbols = [
      { symbol: 'CL=F', name: 'WTI Crude Oil', type: 'crude_wti' },
      { symbol: 'BZ=F', name: 'Brent Crude', type: 'crude_brent' },
      { symbol: 'NG=F', name: 'Natural Gas', type: 'natural_gas' },
      { symbol: 'HO=F', name: 'Heating Oil', type: 'heating_oil' },
      { symbol: 'RB=F', name: 'RBOB Gasoline', type: 'gasoline' },
    ];

    const prices = await Promise.all(
      symbols.map(async ({ symbol, name, type }) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
          const res = await fetchWithTimeout(url, { timeout: 8000 });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          const result = data.chart.result[0];
          const meta = result.meta;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const currentPrice = meta.regularMarketPrice;
          const change = currentPrice - prevClose;
          const changePercent = (change / prevClose) * 100;

          return {
            type,
            name,
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            currency: 'USD',
            updated: new Date().toISOString(),
          };
        } catch {
          return {
            type,
            name,
            price: 0,
            change: 0,
            changePercent: 0,
            currency: 'USD',
            updated: new Date().toISOString(),
            error: true,
          };
        }
      })
    );

    return NextResponse.json(prices, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch oil prices' }, { status: 500 });
  }
}
