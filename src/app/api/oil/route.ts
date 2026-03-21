import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// CNBC public quote API — no API key, batch support
const SYMBOLS = '%40CL.1|%40BZ.1|%40NG.1|%40HO.1|%40RB.1';

const TYPE_MAP: Record<string, { name: string; type: string }> = {
  '@CL.1': { name: 'WTI Crude Oil', type: 'crude_wti' },
  '@BZ.1': { name: 'Brent Crude', type: 'crude_brent' },
  '@NG.1': { name: 'Natural Gas', type: 'natural_gas' },
  '@HO.1': { name: 'Heating Oil', type: 'heating_oil' },
  '@RB.1': { name: 'RBOB Gasoline', type: 'gasoline' },
};

export async function GET() {
  try {
    const url = `https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=${SYMBOLS}&requestMethod=itv&noCache=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`;

    const res = await fetchWithTimeout(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const quotes = data?.FormattedQuoteResult?.FormattedQuote || [];

    const prices = quotes.map((q: Record<string, string>) => {
      const info = TYPE_MAP[q.symbol] || { name: q.name, type: q.symbol };
      const price = parseFloat((q.last || '0').replace(/,/g, ''));
      const change = parseFloat((q.change || '0').replace(/,/g, ''));
      const pct = parseFloat((q.change_pct || '0').replace(/[,%]/g, ''));

      return {
        type: info.type,
        name: info.name,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(pct * 100) / 100,
        currency: 'USD',
        updated: new Date().toISOString(),
      };
    });

    return NextResponse.json(prices, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch oil prices' }, { status: 500 });
  }
}
