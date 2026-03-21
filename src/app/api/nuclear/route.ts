import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// Known Iranian nuclear facilities (public IAEA data)
// This is static reference data - updated manually from IAEA reports
const IRAN_NUCLEAR_FACILITIES = [
  { name: 'Natanz (FEP)', country: 'Iran', type: 'Enrichment', status: 'Active', lat: 33.7244, lon: 51.7275 },
  { name: 'Fordow (FFEP)', country: 'Iran', type: 'Enrichment', status: 'Active', lat: 34.8833, lon: 51.5833 },
  { name: 'Isfahan (UCF)', country: 'Iran', type: 'Conversion', status: 'Active', lat: 32.6333, lon: 51.6667 },
  { name: 'Bushehr NPP', country: 'Iran', type: 'Power Reactor', status: 'Operational', lat: 28.8333, lon: 50.8833 },
  { name: 'Arak (IR-40)', country: 'Iran', type: 'Heavy Water Reactor', status: 'Modified', lat: 34.3833, lon: 49.2333 },
  { name: 'Tehran Research Reactor', country: 'Iran', type: 'Research Reactor', status: 'Operational', lat: 35.7386, lon: 51.3890 },
  { name: 'Parchin Military Complex', country: 'Iran', type: 'Suspected Testing', status: 'Monitored', lat: 35.5167, lon: 51.7667 },
  { name: 'Dimona (Negev)', country: 'Israel', type: 'Nuclear Complex', status: 'Operational', lat: 31.0014, lon: 35.1447 },
  { name: 'Sorek Nuclear Center', country: 'Israel', type: 'Research', status: 'Operational', lat: 31.7000, lon: 34.7167 },
];

export async function GET() {
  return NextResponse.json(IRAN_NUCLEAR_FACILITIES, {
    headers: { 'Cache-Control': 'public, s-maxage=3600' },
  });
}
