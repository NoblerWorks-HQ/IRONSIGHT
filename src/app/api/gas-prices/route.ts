import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// AAA Gas Prices - scrape from public page or use EIA API
// EIA (Energy Information Administration) API - free with key
// For now, we use the collector API endpoint which is publicly available
export async function GET() {
  try {
    // EIA API v2 - free API key available at https://www.eia.gov/opendata/
    // Using the weekly retail gasoline prices
    const url = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[product][]=EPM0U&facets[product][]=EPMP&facets[product][]=EPMR&facets[product][]=EPMRU&sort[0][column]=period&sort[0][direction]=desc&length=10';

    const res = await fetchWithTimeout(url, { timeout: 10000 });
    if (!res.ok) throw new Error('EIA API failed');

    const data = await res.json();

    // Process national average gas prices
    const gasPrices = data.response?.data?.map((item: {
      'area-name': string;
      'product-name': string;
      value: number;
      period: string;
    }) => ({
      area: item['area-name'],
      product: item['product-name'],
      price: item.value,
      period: item.period,
    })) || [];

    return NextResponse.json(gasPrices, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch {
    // Fallback: return placeholder data indicating API key needed
    return NextResponse.json({
      note: 'Get a free EIA API key at https://www.eia.gov/opendata/ for real gas price data',
      national_average: {
        regular: null,
        midgrade: null,
        premium: null,
        diesel: null,
        source: 'EIA',
      },
    });
  }
}
