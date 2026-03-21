import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';
import type { HumanitarianReport } from '@/types';

export const dynamic = 'force-dynamic';

// ReliefWeb API - UN OCHA, completely free, no key needed
export async function GET() {
  try {
    const url = 'https://api.reliefweb.int/v1/reports?appname=ironsight&filter[field]=country&filter[value][]=Iran&filter[value][]=Israel&filter[value][]=Iraq&filter[value][]=Syria&filter[value][]=Lebanon&filter[value][]=Yemen&sort[]=date:desc&limit=25&fields[include][]=title&fields[include][]=date.original&fields[include][]=source&fields[include][]=url_alias&fields[include][]=country&fields[include][]=format';

    const res = await fetchWithTimeout(url, { timeout: 10000 });
    if (!res.ok) throw new Error('ReliefWeb API failed');

    const data = await res.json();

    const reports: HumanitarianReport[] = data.data.map((item: {
      fields: {
        title: string;
        date?: { original: string };
        source?: { name: string }[];
        country?: { name: string }[];
        url_alias?: string;
        format?: { name: string }[];
      };
    }) => ({
      title: item.fields.title,
      date: item.fields.date?.original || '',
      country: item.fields.country?.map((c: { name: string }) => c.name).join(', ') || '',
      source: item.fields.source?.[0]?.name || 'ReliefWeb',
      url: `https://reliefweb.int${item.fields.url_alias || ''}`,
      type: item.fields.format?.[0]?.name || 'Report',
    }));

    return NextResponse.json(reports, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
