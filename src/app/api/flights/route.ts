import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';
import { getConflictFromRequest } from '@/lib/conflicts';

export const dynamic = 'force-dynamic';

// Uses adsb.lol — free, community-run ADS-B aggregator
// Has a military database (dbFlags bit 1) that properly identifies military aircraft
// Much better than OpenSky for mil tracking

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  const { flightsCenter: center, flightsBBox: bbox } = server;
  try {
    // Fetch all sources in parallel with short timeouts
    const [milResult, regionResult] = await Promise.allSettled([
      fetchWithTimeout('https://api.adsb.lol/v2/mil', {
        timeout: 8000,
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { ac: [] }),
      fetchWithTimeout(`https://api.adsb.lol/v2/lat/${center.lat}/lon/${center.lon}/dist/${center.dist}`, {
        timeout: 8000,
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { ac: [] }),
    ]);

    const milData = milResult.status === 'fulfilled' ? milResult.value : { ac: [] };
    const regionData = regionResult.status === 'fulfilled' ? regionResult.value : { ac: [] };

    // Filter mil feed to the active conflict's region
    const milAircraft = (milData.ac || []).filter((a: AircraftState) =>
      a.lat && a.lon && a.lat >= bbox.latMin && a.lat <= bbox.latMax && a.lon >= bbox.lonMin && a.lon <= bbox.lonMax
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

// Exact ICAO type designators (Doc 8643) that are unambiguously military.
// Matched EXACTLY, never as substrings — a substring match turns a Cessna 172
// into a C-17 Globemaster, a Citation Excel (C56X) into a C-5 Galaxy, an
// Embraer Legacy (E35L) into an E-3 AWACS and a King Air (B200) into a B-2.
//
// Dual-use designators are deliberately excluded: B737/B738/B739 (the 737 is
// the most common airliner in the theater), A332/A310 (the MRTT tanker shares
// the civil A330/A310 code), GLF5/GLF6 (Gulfstream), A124 and C40. Genuine
// military examples of those airframes already carry adsb.lol's dbFlags
// military bit and are captured by the flag check, so no real signal is lost.
const MILITARY_AIRCRAFT_TYPES = new Set([
  // Airlift / tanker
  'C17', 'C5', 'C5M', 'C130', 'C30J', 'C160', 'C2', 'A400', 'C295', 'CN35',
  'K35R', 'K35E', 'K35T', 'K46',
  // ISR / AEW / airborne C2
  'E2', 'E3TF', 'E3CF', 'E6', 'E8', 'R135', 'P8', 'P3', 'Q4', 'Q9', 'Q1',
  // Fighters / attack
  'F14', 'F15', 'F16', 'F18', 'F22', 'F35', 'A10',
  'EUFI', 'RFAL', 'MIR2', 'TOR', 'HAWK',
  'MG29', 'SU25', 'SU27', 'SU30', 'SU34',
  // Bombers
  'B1', 'B2', 'B21', 'B52', 'TU95', 'TU22', 'TU16',
  // Rotary / tiltrotor
  'V22', 'H60', 'H47', 'H64', 'H53', 'UH1',
  // Russian / Soviet transports
  'IL76', 'IL78', 'AN12', 'AN22', 'AN26', 'AN32', 'AN70', 'AN72',
]);

function isMilitaryCallsign(callsign: string): boolean {
  if (!callsign) return false;
  // A military callsign is a known prefix followed by a numeric mission number
  // (RCH471, PLF110). Requiring that digit boundary stops civil callsigns that
  // merely begin with the same letters — e.g. SAMU42 and SAMU06, French air
  // ambulances, matching the US "SAM" (Special Air Mission) prefix.
  return MILITARY_CALLSIGN_PREFIXES.some(
    prefix => callsign.startsWith(prefix) && /\d/.test(callsign.charAt(prefix.length))
  );
}

function isMilitaryType(type: string): boolean {
  if (!type) return false;
  return MILITARY_AIRCRAFT_TYPES.has(type.trim().toUpperCase());
}

// Exact ICAO designator -> mission role. Keys must appear in
// MILITARY_AIRCRAFT_TYPES or arrive via the dbFlags military bit.
const TYPE_ROLES: Record<string, string> = {
  Q4: 'ISR Drone (UAV)', Q9: 'ISR Drone (UAV)', Q1: 'ISR Drone (UAV)',
  R135: 'SIGINT/ELINT',
  E3TF: 'AWACS', E3CF: 'AWACS',
  E8: 'JSTARS',
  E6: 'TACAMO (Nuclear C2)',
  E2: 'Hawkeye (AEW)',
  P8: 'Maritime Patrol', P3: 'Maritime Patrol',
  K35R: 'Aerial Tanker', K35E: 'Aerial Tanker', K35T: 'Aerial Tanker',
  K46: 'Aerial Tanker', IL78: 'Aerial Tanker',
  C17: 'Strategic Airlift (C-17)',
  C5: 'Strategic Airlift (C-5)', C5M: 'Strategic Airlift (C-5)',
  C130: 'Tactical Transport', C30J: 'Tactical Transport', C160: 'Tactical Transport',
  C295: 'Tactical Transport', CN35: 'Tactical Transport', A400: 'Tactical Transport',
  C2: 'Navy Transport (C-2)',
  V22: 'Tiltrotor (V-22)',
  H60: 'Helicopter', H47: 'Helicopter', H64: 'Helicopter',
  H53: 'Helicopter', UH1: 'Helicopter',
  F35: 'Fighter (F-35)', F22: 'Fighter (F-22)', F16: 'Fighter (F-16)',
  F15: 'Fighter (F-15)', F18: 'Fighter (F/A-18)', F14: 'Fighter (F-14)',
  EUFI: 'Fighter (NATO)', RFAL: 'Fighter (NATO)', TOR: 'Fighter (NATO)',
  MIR2: 'Fighter (NATO)', HAWK: 'Trainer / Light Attack',
  MG29: 'Fighter', SU27: 'Fighter', SU30: 'Fighter',
  SU25: 'Attack', SU34: 'Strike',
  A10: 'Attack (A-10)',
  B52: 'Bomber', B1: 'Bomber', B2: 'Bomber', B21: 'Bomber',
  TU95: 'Bomber', TU22: 'Bomber', TU16: 'Bomber',
  IL76: 'Heavy Transport', AN12: 'Heavy Transport', AN22: 'Heavy Transport',
  AN26: 'Heavy Transport', AN32: 'Heavy Transport', AN70: 'Heavy Transport',
  AN72: 'Heavy Transport',
};

function classifyAircraft(callsign: string, acType: string, desc: string, altitude: number, speed: number): string {
  const cs = callsign.toUpperCase();
  const t = acType.toUpperCase();
  const d = desc.toLowerCase();

  // By aircraft type first (most reliable) — exact designator lookup, not
  // substring, for the same reason as MILITARY_AIRCRAFT_TYPES above.
  const role = TYPE_ROLES[t];
  if (role) return role;

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
  if (n >= 0x140000 && n <= 0x1FFFFF) return 'Russia';
  if (n >= 0x508000 && n <= 0x50FFFF) return 'Ukraine';
  if (n >= 0x510000 && n <= 0x5103FF) return 'Belarus';
  if (n >= 0x400000 && n <= 0x43FFFF) return 'NATO/Europe';
  return '';
}
