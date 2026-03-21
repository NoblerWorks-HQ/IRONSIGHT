import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// Uses adsb.lol — free, community-run ADS-B aggregator
// Has a military database (dbFlags bit 1) that properly identifies military aircraft
// Much better than OpenSky for mil tracking

export async function GET() {
  try {
    // Fetch all sources in parallel with short timeouts
    const [milResult, regionResult] = await Promise.allSettled([
      fetchWithTimeout('https://api.adsb.lol/v2/mil', {
        timeout: 8000,
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { ac: [] }),
      fetchWithTimeout('https://api.adsb.lol/v2/lat/30/lon/48/dist/2500', {
        timeout: 8000,
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { ac: [] }),
    ]);

    const milData = milResult.status === 'fulfilled' ? milResult.value : { ac: [] };
    const regionData = regionResult.status === 'fulfilled' ? regionResult.value : { ac: [] };

    // Filter mil feed to Middle East region
    const milAircraft = (milData.ac || []).filter((a: AircraftState) =>
      a.lat && a.lon && a.lat >= 10 && a.lat <= 45 && a.lon >= 20 && a.lon <= 70
    );

    // From regional feed, get military flagged + interesting aircraft
    const regionMil = (regionData.ac || []).filter((a: AircraftState) => {
      const flags = a.dbFlags || 0;
      return (flags & 1) || (flags & 2); // military or interesting
    });

    // Also check regional feed for military callsigns, types, or US mil hex with no callsign
    const regionCallsignMil = (regionData.ac || []).filter((a: AircraftState) => {
      const flags = a.dbFlags || 0;
      if ((flags & 1) || (flags & 2)) return false; // already captured above
      const cs = (a.flight || '').trim().toUpperCase();
      const hexStr = (a.hex || '').replace('~', '');
      let hexNum = 0;
      try { hexNum = parseInt(hexStr, 16); } catch { /* skip */ }

      // Check callsign prefixes
      if (isMilitaryCallsign(cs)) return true;
      // Check aircraft type
      if (isMilitaryType(a.t || '')) return true;
      // US military ICAO hex range (AE/AF block) with no callsign — likely mil with transponder on
      if (!cs && hexNum >= 0xAE0000 && hexNum <= 0xAFFFFF) return true;
      // Any US hex range aircraft with a military-associated type
      if (hexNum >= 0xA00000 && hexNum <= 0xAFFFFF && isMilitaryType(a.t || '')) return true;

      return false;
    });

    // Merge and deduplicate by hex
    const seen = new Set<string>();
    const allMil: AircraftState[] = [];

    for (const list of [milAircraft, regionMil, regionCallsignMil]) {
      for (const a of list) {
        const hex = (a.hex || '').trim().replace('~', '');
        if (hex && !seen.has(hex) && a.lat && a.lon) {
          seen.add(hex);
          allMil.push(a);
        }
      }
    }

    const totalRegion = (regionData.ac || []).length;

    const flights = allMil.map((a: AircraftState) => {
      const callsign = (a.flight || '').trim();
      const altitude = typeof a.alt_baro === 'number' ? a.alt_baro :
                       a.alt_baro === 'ground' ? 0 :
                       parseInt(String(a.alt_baro) || '0') || 0;
      const speed = Math.round(a.gs || 0);
      const heading = Math.round(a.track || 0);
      const flags = a.dbFlags || 0;

      return {
        icao24: (a.hex || '').trim(),
        callsign,
        origin: a.ownOp || getOriginFromHex(a.hex || '') || 'Unknown',
        lat: a.lat!,
        lon: a.lon!,
        altitude,
        heading,
        speed,
        type: classifyAircraft(callsign, a.t || '', a.desc || '', altitude, speed),
        aircraftType: a.t || '',
        registration: a.r || '',
        description: a.desc || '',
        squawk: a.squawk || '',
        isMilitary: !!(flags & 1),
        isInteresting: !!(flags & 2),
      };
    });

    return NextResponse.json({
      total: totalRegion,
      military: flights.length,
      flights,
      source: 'adsb.lol',
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
    });
  } catch (err) {
    console.error('Flights fetch error:', err);
    return NextResponse.json({
      total: 0, military: 0, flights: [],
      source: 'adsb.lol', updated: new Date().toISOString(),
    }, { status: 200 });
  }
}

interface AircraftState {
  hex?: string;
  flight?: string;
  t?: string;         // aircraft type (e.g., "C17", "F16")
  r?: string;         // registration
  desc?: string;      // aircraft description
  ownOp?: string;     // owner/operator
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  gs?: number;        // ground speed
  track?: number;     // heading
  squawk?: string;
  dbFlags?: number;   // 1=military, 2=interesting, 4=PIA, 8=LADD
}

const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'REACH', 'DUKE', 'EVAC', 'GOLD', 'HAWK', 'IRON', 'JAKE', 'KING',
  'KNIFE', 'MAG', 'NAVY', 'ORCA', 'RAGE', 'ROCKY', 'SAM', 'SPAR', 'STEEL',
  'TABOR', 'TEAL', 'THUD', 'TITAN', 'VIPER', 'WRATH', 'DOOM', 'EPIC',
  'FORTE', 'HOMER', 'NCHO', 'SCORE', 'PACK', 'BOLT', 'DAGGER', 'ODIN',
  'ATLAS', 'CLUB', 'CHIEF', 'COBRA', 'COMET', 'DEMON', 'GHOST', 'LANCE',
  'REBEL', 'SKULL', 'STORM', 'SWORD', 'WOLF', 'TOPCT', 'NITE', 'HERC',
  'CASA', 'CSAR', 'IAF', 'RRR', 'ASCOT', 'TARTAN', 'FAF', 'CTM', 'FRAF',
  'NATO', 'MMF', 'GAF', 'IAM', 'TUAF', 'BAF', 'NAF', 'DNAF', 'NOAF',
  'PLF', 'CAAF', 'RSAF', 'QAF', 'KAF', 'ROF', 'AME', 'INDIA',
  'BOXER', 'FIVER', 'HAVE', 'LEAD', 'PUMA', 'RHINO', 'SPARK', 'TANGO',
  'UNITY', 'VALOR', 'WITCH', 'ZERO',
];

const MILITARY_AIRCRAFT_TYPES = [
  'C17', 'C5', 'C130', 'C2', 'C40', 'KC135', 'KC46', 'KC10', 'KC30',
  'E3', 'E6', 'E8', 'RC135', 'EC130', 'EP3', 'P8', 'P3',
  'RQ4', 'MQ9', 'MQ1', 'RQ170',
  'F15', 'F16', 'F18', 'F22', 'F35', 'F14',
  'A10', 'B52', 'B1', 'B2', 'B21',
  'V22', 'H60', 'CH47', 'AH64', 'MH53', 'UH1',
  'A400', 'C295', 'CN35',
  'E2C', 'E2D',
  'EUFI', // Eurofighter
  'F2KA', // Rafale
  'TOR', // Tornado
  'HAWK',
  'GLF5', 'GLF6', // Military Gulfstreams (C-37)
  'B737', // Some military 737s (P-8 base, govt)
  'B738', 'B739',
  'A332', // MRTT tankers
  'A310', // Military tankers
  'A124', // Antonov (interesting)
  'IL76', 'IL78', // Russian military
  'AN12', 'AN22', 'AN26', 'AN32', 'AN72',
];

function isMilitaryCallsign(callsign: string): boolean {
  if (!callsign) return false;
  for (const prefix of MILITARY_CALLSIGN_PREFIXES) {
    if (callsign.startsWith(prefix)) return true;
  }
  if (/^\d{5,6}$/.test(callsign)) return true;
  return false;
}

function isMilitaryType(type: string): boolean {
  if (!type) return false;
  const upper = type.toUpperCase();
  return MILITARY_AIRCRAFT_TYPES.some(mt => upper.includes(mt));
}

function classifyAircraft(callsign: string, acType: string, desc: string, altitude: number, speed: number): string {
  const cs = callsign.toUpperCase();
  const t = acType.toUpperCase();
  const d = desc.toLowerCase();

  // By aircraft type first (most reliable)
  if (t.includes('RQ4') || t.includes('MQ9') || t.includes('MQ1')) return 'ISR Drone (UAV)';
  if (t.includes('RC135') || t.includes('EP3') || t.includes('EC130')) return 'SIGINT/ELINT';
  if (t.includes('E3') || t.includes('E767')) return 'AWACS';
  if (t.includes('E8')) return 'JSTARS';
  if (t.includes('E6')) return 'TACAMO (Nuclear C2)';
  if (t.includes('E2')) return 'Hawkeye (AEW)';
  if (t.includes('P8') || t.includes('P3')) return 'Maritime Patrol';
  if (t.includes('KC135') || t.includes('KC46') || t.includes('KC10') || t.includes('KC30') || t.includes('A332') || t.includes('A310')) return 'Aerial Tanker';
  if (t.includes('C17')) return 'Strategic Airlift (C-17)';
  if (t.includes('C5')) return 'Strategic Airlift (C-5)';
  if (t.includes('C130') || t.includes('C295') || t.includes('CN35') || t.includes('A400')) return 'Tactical Transport';
  if (t.includes('C40') || (t.includes('B737') && cs.startsWith('NAVY'))) return 'Navy Transport (C-40)';
  if (t.includes('V22')) return 'Tiltrotor (V-22)';
  if (t.includes('H60') || t.includes('MH53') || t.includes('CH47') || t.includes('AH64')) return 'Helicopter';
  if (t.includes('F35')) return 'Fighter (F-35)';
  if (t.includes('F22')) return 'Fighter (F-22)';
  if (t.includes('F16')) return 'Fighter (F-16)';
  if (t.includes('F15')) return 'Fighter (F-15)';
  if (t.includes('F18')) return 'Fighter (F/A-18)';
  if (t.includes('EUFI') || t.includes('F2KA') || t.includes('TOR')) return 'Fighter (NATO)';
  if (t.includes('A10')) return 'Attack (A-10)';
  if (t.includes('B52') || t.includes('B1') || t.includes('B2') || t.includes('B21')) return 'Bomber';
  if (t.includes('A124') || t.includes('IL76') || t.includes('AN')) return 'Heavy Transport';
  if (t.includes('GLF')) return 'VIP/C2 Transport';

  // By callsign
  if (cs.startsWith('FORTE')) return 'RQ-4 Global Hawk (ISR)';
  if (cs.startsWith('RCH') || cs.startsWith('REACH') || cs.startsWith('ATLAS')) return 'Strategic Airlift';
  if (cs.startsWith('TOPCT')) return 'Aerial Tanker';
  if (cs.startsWith('KING') || cs.startsWith('CSAR')) return 'CSAR/Rescue';
  if (cs.startsWith('NAVY') || cs.startsWith('ORCA')) return 'Navy Aviation';
  if (cs.startsWith('KNIFE') || cs.startsWith('DOOM')) return 'Special Operations';
  if (cs.startsWith('SAM') || cs.startsWith('SPAR') || cs.startsWith('INDIA')) return 'VIP/Government';
  if (cs.startsWith('EVAC')) return 'Medical Evacuation';
  if (cs.startsWith('ASCOT') || cs.startsWith('RRR')) return 'RAF Transport';

  // By description
  if (d.includes('tanker') || d.includes('refuel')) return 'Aerial Tanker';
  if (d.includes('surveillance') || d.includes('reconnaissance')) return 'ISR';
  if (d.includes('fighter') || d.includes('combat')) return 'Fighter';
  if (d.includes('transport') || d.includes('cargo')) return 'Military Transport';
  if (d.includes('patrol')) return 'Maritime Patrol';
  if (d.includes('helicopter') || d.includes('rotary')) return 'Helicopter';

  // By flight characteristics
  if (altitude > 50000) return 'High-Alt ISR/Drone';
  if (speed > 500 && altitude > 30000) return 'Fast Mover';

  return 'Military Aircraft';
}

function getOriginFromHex(hex: string): string {
  const n = parseInt(hex, 16);
  if (n >= 0xA00000 && n <= 0xAFFFFF) return 'United States';
  if (n >= 0x430000 && n <= 0x43FFFF) return 'United Kingdom';
  if (n >= 0x380000 && n <= 0x3BFFFF) return 'France';
  if (n >= 0x3C0000 && n <= 0x3FFFFF) return 'Germany';
  if (n >= 0x300000 && n <= 0x33FFFF) return 'Italy';
  if (n >= 0x340000 && n <= 0x37FFFF) return 'Spain';
  if (n >= 0x738000 && n <= 0x73FFFF) return 'Israel';
  if (n >= 0x730000 && n <= 0x737FFF) return 'Iran';
  if (n >= 0x740000 && n <= 0x741FFF) return 'Turkey';
  if (n >= 0x710000 && n <= 0x71FFFF) return 'Saudi Arabia';
  if (n >= 0x896000 && n <= 0x896FFF) return 'UAE';
  if (n >= 0x400000 && n <= 0x43FFFF) return 'NATO/Europe';
  return '';
}
