import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';
import { translateHebrew, translateCities, isHebrew, translateFreeText, CITY_TRANSLATIONS } from '@/lib/hebrew';
import { getConflictFromRequest } from '@/lib/conflicts';

export const dynamic = 'force-dynamic';

// Sticky alert cache — keep alerts visible for 90 seconds after they clear from the API.
// Cached per conflict so switching theaters doesn't leak stale alerts.
const STICKY_DURATION = 90_000; // 90 seconds
const stickyByConflict: Record<string, (AlertEvent & { firstSeen: number })[]> = {};

// Air-raid alerts. Provider depends on the active conflict:
//  - tzevaadom: Israeli Home Front Command (Pikud HaOref) real-time alerts
//  - alertsua:  Ukrainian oblast air-raid alerts via free alerts.com.ua API
// Empty array = no active alerts (which is good)
export async function GET(req: Request) {
  const { key, client, server } = getConflictFromRequest(req);
  const sourceLabel = client.alertSystemName;
  let stickyAlerts = stickyByConflict[key] || [];

  const alerts: AlertEvent[] =
    server.alertProvider === 'alertsua'
      ? await fetchUkraineAlerts(sourceLabel)
      : await fetchTzevaAdomAlerts(sourceLabel);

  // Add new alerts to sticky cache
  const now = Date.now();
  for (const alert of alerts) {
    const exists = stickyAlerts.find(s => s.threatOriginal === alert.threatOriginal && s.locationsOriginal.join() === alert.locationsOriginal.join());
    if (!exists) {
      stickyAlerts.push({ ...alert, firstSeen: now });
    }
  }

  // Remove alerts older than 90 seconds
  stickyAlerts = stickyAlerts.filter(s => now - s.firstSeen < STICKY_DURATION);
  stickyByConflict[key] = stickyAlerts;

  // Mark alerts that are no longer live from the API as clearing
  const allAlerts = stickyAlerts.map(s => ({
    ...s,
    active: alerts.some(a => a.threatOriginal === s.threatOriginal && a.locationsOriginal.join() === s.locationsOriginal.join()),
  }));

  const status = allAlerts.length > 0 ? 'ACTIVE' : 'CLEAR';

  return NextResponse.json({
    status,
    activeCount: allAlerts.length,
    alerts: allAlerts,
    lastChecked: new Date().toISOString(),
    source: sourceLabel,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3' }, // Check every 5 seconds
  });
}

// --- Provider: Israeli Home Front Command via Tzeva Adom (Hebrew) ---
async function fetchTzevaAdomAlerts(sourceLabel: string): Promise<AlertEvent[]> {
  const alerts: AlertEvent[] = [];
  try {
    const res = await fetchWithTimeout('https://api.tzevaadom.co.il/notifications', {
      timeout: 12000,
      headers: { 'User-Agent': 'IronSight/1.0', 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((alert: TzevaAdomAlert, i: number) => {
          const rawThreat = alert.threat || alert.title || 'Alert';
          const rawCities = Array.isArray(alert.cities) ? alert.cities : [alert.data || 'Unknown'];

          let translatedThreat = translateHebrew(rawThreat);
          const translatedLocations = translateCities(rawCities);

          // If the "threat" field is actually a city name (API sometimes puts city in wrong field),
          // move it to locations and use a generic threat label
          if (CITY_TRANSLATIONS[rawThreat]) {
            if (!rawCities.includes(rawThreat)) {
              translatedLocations.push(CITY_TRANSLATIONS[rawThreat]);
            }
            translatedThreat = 'Rocket/Missile Alert';
          }

          alerts.push({
            id: `tzeva-${i}-${Date.now()}`,
            time: alert.date || new Date().toISOString(),
            type: categorizeAlert(rawThreat),
            threat: translatedThreat,
            threatOriginal: rawThreat,
            locations: translatedLocations,
            locationsOriginal: rawCities,
            source: sourceLabel,
            active: true,
          });
        });
      }
    }
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('Timeout') || (err as NodeJS.ErrnoException).code === 'UND_ERR_CONNECT_TIMEOUT');
    if (!isTimeout) console.error('Tzeva Adom fetch error:', err);
  }

  // Fallback: use Google Translate for any remaining Hebrew text the dictionary missed
  await Promise.all(alerts.map(async (alert) => {
    if (isHebrew(alert.threat)) {
      alert.threat = await translateFreeText(alert.threat);
    }
    alert.locations = await Promise.all(
      alert.locations.map(loc => isHebrew(loc) ? translateFreeText(loc) : Promise.resolve(loc))
    );
  }));

  return alerts;
}

// --- Provider: Ukrainian oblast air-raid alerts via alerts.com.ua (free, English names) ---
async function fetchUkraineAlerts(sourceLabel: string): Promise<AlertEvent[]> {
  const alerts: AlertEvent[] = [];
  try {
    const res = await fetchWithTimeout('https://alerts.com.ua/api/states', {
      timeout: 12000,
      headers: { 'User-Agent': 'IronSight/1.0', 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const states: AlertsUaState[] = Array.isArray(data?.states) ? data.states : [];
      states.filter(s => s.alert).forEach((s, i) => {
        const name = s.name_en || s.name || 'Unknown';
        alerts.push({
          id: `ua-${s.id ?? i}-${Date.now()}`,
          time: s.changed || new Date().toISOString(),
          type: 'ALERT',
          threat: 'Air Raid Alert',
          threatOriginal: `ua-${s.id ?? name}`,
          locations: [name],
          locationsOriginal: [name],
          source: sourceLabel,
          active: true,
        });
      });
    }
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('Timeout') || (err as NodeJS.ErrnoException).code === 'UND_ERR_CONNECT_TIMEOUT');
    if (!isTimeout) console.error('alerts.com.ua fetch error:', err);
  }
  return alerts;
}

interface AlertsUaState {
  id?: number;
  name?: string;
  name_en?: string;
  alert?: boolean;
  changed?: string;
}

interface TzevaAdomAlert {
  date?: string;
  title?: string;
  data?: string;
  threat?: string;
  cities?: string[];
}

interface AlertEvent {
  id: string;
  time: string;
  type: string;
  threat: string;
  threatOriginal: string;
  locations: string[];
  locationsOriginal: string[];
  source: string;
  active: boolean;
}

function categorizeAlert(threat: string): string {
  const t = threat.toLowerCase();
  if (t.includes('missile') || t.includes('טיל') || t.includes('ballistic')) return 'MISSILE';
  if (t.includes('rocket') || t.includes('רקט')) return 'ROCKET';
  if (t.includes('drone') || t.includes('uav') || t.includes('כטב') || t.includes('hostile aircraft')) return 'DRONE';
  if (t.includes('mortar')) return 'MORTAR';
  if (t.includes('infiltration') || t.includes('חדיר')) return 'INFILTRATION';
  if (t.includes('earthquake') || t.includes('רעידת')) return 'EARTHQUAKE';
  if (t.includes('tsunami')) return 'TSUNAMI';
  if (t.includes('chemical') || t.includes('hazmat')) return 'HAZMAT';
  return 'ALERT';
}
