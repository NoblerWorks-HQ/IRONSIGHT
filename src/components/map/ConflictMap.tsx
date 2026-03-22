'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDataFeed } from '@/lib/hooks';

let L: typeof import('leaflet') | null = null;

interface FlightData {
  total: number;
  military: number;
  flights: {
    icao24: string;
    callsign: string;
    origin: string;
    lat: number;
    lon: number;
    altitude: number;
    heading: number;
    speed: number;
    type: string;
    aircraftType: string;
    registration: string;
    squawk: string;
    isMilitary: boolean;
    isInteresting: boolean;
  }[];
}

interface NavalData {
  ships: {
    name: string;
    hull: string;
    type: string;
    class: string;
    navy: string;
    lat: number;
    lon: number;
    status: string;
    region: string;
    group?: string;
  }[];
}

interface AlertData {
  status: 'ACTIVE' | 'CLEAR';
  alerts: {
    type: string;
    threat: string;
    locations: string[];
    time: string;
  }[];
}

interface ConflictEvent {
  id: string;
  date: string;
  type: string;
  location: string;
  lat: number;
  lon: number;
  description: string;
  source: string;
}

interface StrikeData {
  id: string;
  date: string;
  category: string;
  severity: string;
  title: string;
  source: string;
  url: string;
  country: string;
}

interface TelegramData {
  posts: {
    channel: string;
    channelLabel: string;
    color: string;
    postId: number;
    text: string;
    date: string;
    url: string;
  }[];
}

interface MapProps {
  className?: string;
}

// === STATIC DATA ===

const CITIES = [
  { name: 'Tehran', lat: 35.6892, lon: 51.3890, country: 'Iran', capital: true },
  { name: 'Isfahan', lat: 32.6546, lon: 51.6680, country: 'Iran', capital: false },
  { name: 'Shiraz', lat: 29.5918, lon: 52.5837, country: 'Iran', capital: false },
  { name: 'Tabriz', lat: 38.0800, lon: 46.2919, country: 'Iran', capital: false },
  { name: 'Bandar Abbas', lat: 27.1865, lon: 56.2808, country: 'Iran', capital: false },
  { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, country: 'Israel', capital: false },
  { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, country: 'Israel', capital: true },
  { name: 'Haifa', lat: 32.7940, lon: 34.9896, country: 'Israel', capital: false },
  { name: 'Baghdad', lat: 33.3152, lon: 44.3661, country: 'Iraq', capital: true },
  { name: 'Damascus', lat: 33.5138, lon: 36.2765, country: 'Syria', capital: true },
  { name: 'Beirut', lat: 33.8938, lon: 35.5018, country: 'Lebanon', capital: true },
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753, country: 'Saudi Arabia', capital: true },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', capital: false },
  { name: 'Doha', lat: 25.2854, lon: 51.5310, country: 'Qatar', capital: true },
  { name: 'Manama', lat: 26.2285, lon: 50.5860, country: 'Bahrain', capital: true },
  { name: 'Kuwait City', lat: 29.3759, lon: 47.9774, country: 'Kuwait', capital: true },
  { name: 'Amman', lat: 31.9454, lon: 35.9284, country: 'Jordan', capital: true },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'Egypt', capital: true },
  { name: 'Ankara', lat: 39.9334, lon: 32.8597, country: 'Turkey', capital: true },
  { name: "Sana'a", lat: 15.3694, lon: 44.1910, country: 'Yemen', capital: true },
  { name: 'Aden', lat: 12.7855, lon: 45.0187, country: 'Yemen', capital: false },
  { name: 'Muscat', lat: 23.5880, lon: 58.3829, country: 'Oman', capital: true },
  { name: 'Dimona', lat: 31.0700, lon: 35.0300, country: 'Israel', capital: false },
];

const NAVY_COLORS: Record<string, string> = {
  'US Navy': '#00aaff', 'Royal Navy': '#4488cc', 'French Navy': '#6666cc',
  'Israeli Navy': '#00d4ff', 'Iran Navy': '#ff3366', 'IRGC Navy': '#ff3366', 'Saudi Navy': '#00ff88',
};

const ALERT_CITIES: Record<string, [number, number]> = {
  'tel aviv': [32.085, 34.782], 'haifa': [32.794, 34.990], 'jerusalem': [31.768, 35.214],
  'beer sheva': [31.252, 34.791], 'ashkelon': [31.669, 34.574], 'ashdod': [31.804, 34.655],
  'sderot': [31.525, 34.596], 'eilat': [29.558, 34.952], 'tiberias': [32.796, 35.530],
  'nahariya': [33.010, 35.098], 'dimona': [31.070, 35.030], 'arad': [31.261, 35.213],
};

// Iranian missile launch sites (known/approximate)
const IRAN_LAUNCH_SITES = [
  { name: 'Tabriz IRGC Base', lat: 38.08, lon: 46.29, range: 2000 },
  { name: 'Isfahan Missile Base', lat: 32.65, lon: 51.67, range: 2000 },
  { name: 'Shiraz Air Base', lat: 29.54, lon: 52.59, range: 1800 },
  { name: 'Khorramabad Base', lat: 33.49, lon: 48.35, range: 2000 },
];

// Geocode strike locations from conflict descriptions
const STRIKE_LOCATIONS: Record<string, [number, number]> = {
  // Iran
  'tehran': [35.69, 51.39], 'isfahan': [32.65, 51.67], 'natanz': [33.51, 51.73],
  'shiraz': [29.59, 52.58], 'tabriz': [38.08, 46.29], 'bushehr': [28.97, 50.84],
  'bandar abbas': [27.19, 56.28], 'kharg island': [29.24, 50.31], 'south pars': [27.5, 52.6],
  'iran': [32.5, 53.0],
  // Israel
  'tel aviv': [32.09, 34.78], 'haifa': [32.79, 34.99], 'dimona': [31.07, 35.03],
  'jerusalem': [31.77, 35.21], 'beer sheva': [31.25, 34.79], 'eilat': [29.56, 34.95],
  'negev': [30.85, 34.78], 'arad': [31.26, 35.21], 'ashdod': [31.80, 34.66],
  'ashkelon': [31.67, 34.57], 'ben gurion': [32.01, 34.87], 'nuclear': [31.07, 35.03],
  'israel': [31.5, 34.8],
  // Lebanon
  'beirut': [33.89, 35.50], 'hezbollah': [33.60, 35.50], 'litani': [33.35, 35.30],
  'south lebanon': [33.30, 35.40], 'lebanon': [33.85, 35.86],
  // Others
  'syria': [34.80, 38.99], 'damascus': [33.51, 36.28],
  'iraq': [33.31, 44.37], 'baghdad': [33.31, 44.37],
  'yemen': [15.37, 44.19], 'houthi': [15.37, 44.19], 'red sea': [14.5, 42.5],
  'gaza': [31.42, 34.36], 'strait of hormuz': [26.56, 56.25],
  'qatar': [25.29, 51.53], 'doha': [25.29, 51.53],
  'saudi': [24.71, 46.68], 'diego garcia': [-7.32, 72.42],
  'kuwait': [29.38, 47.98],
};

function getFlightColor(origin: string): string {
  if (origin.includes('US') || origin === 'United States') return '#00aaff';
  if (origin.includes('Israel')) return '#00d4ff';
  if (origin.includes('Iran')) return '#ff3366';
  if (origin.includes('UK') || origin.includes('Royal')) return '#4488cc';
  return '#ffaa00';
}

function animateMarker(marker: L.Marker, targetLat: number, targetLon: number, duration: number) {
  const start = marker.getLatLng();
  const startTime = performance.now();
  const dlat = targetLat - start.lat;
  const dlon = targetLon - start.lng;
  if (Math.abs(dlat) < 0.001 && Math.abs(dlon) < 0.001) return;
  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    marker.setLatLng([start.lat + dlat * ease, start.lng + dlon * ease]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Draw an animated arc between two points (missile trajectory) — loops until cancelled
function drawMissileArc(map: L.Map, from: [number, number], to: [number, number], color: string, layerGroup: L.LayerGroup): () => void {
  if (!L) return () => {};
  const points: [number, number][] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lon = from[1] + (to[1] - from[1]) * t;
    const arcHeight = Math.sin(t * Math.PI) * 3;
    points.push([lat + arcHeight, lon]);
  }

  let cancelled = false;

  const polyline = L.polyline([], {
    color,
    weight: 2,
    opacity: 0.8,
    dashArray: '6, 4',
    className: 'missile-arc',
  }).addTo(layerGroup);

  const warhead = L.circleMarker(from, {
    radius: 4, color, fillColor: color, fillOpacity: 1, weight: 0,
  }).addTo(layerGroup);

  function animateLoop() {
    if (cancelled) return;
    let currentStep = 0;

    function step() {
      if (cancelled) return;
      if (currentStep >= points.length) {
        // Impact flash
        const impact = L!.circleMarker(to, {
          radius: 15, color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.6, weight: 2,
          className: 'alert-flash',
        }).addTo(layerGroup);
        setTimeout(() => { try { layerGroup.removeLayer(impact); } catch {} }, 2000);

        // Reset and loop after a pause
        setTimeout(() => {
          if (cancelled) return;
          polyline.setLatLngs([]);
          warhead.setLatLng(from);
          animateLoop();
        }, 3000);
        return;
      }
      polyline.setLatLngs(points.slice(0, currentStep + 1));
      warhead.setLatLng(points[currentStep]);
      currentStep++;
      setTimeout(step, 50);
    }
    step();
  }
  animateLoop();

  // Return cancel function
  return () => {
    cancelled = true;
    try {
      layerGroup.removeLayer(polyline);
      layerGroup.removeLayer(warhead);
    } catch {}
  };
}

// Geocode a strike — ONLY match specific locations, not generic country names
// This prevents "Iran war: day 22" from placing a random pin on the map
function geocodeStrike(description: string, location: string): { coords: [number, number]; place: string } | null {
  const text = `${description} ${location}`.toLowerCase();

  // Only match specific cities/targets — never generic "iran" or "israel"
  const targets: [string, string][] = [
    // Israel targets
    ['arad', 'Arad'], ['dimona', 'Dimona'], ['natanz', 'Natanz'], ['ben gurion', 'Ben Gurion Airport'],
    ['tel aviv', 'Tel Aviv'], ['haifa', 'Haifa'], ['beer sheva', 'Beer Sheva'], ['eilat', 'Eilat'],
    ['ashkelon', 'Ashkelon'], ['ashdod', 'Ashdod'], ['negev', 'Negev'], ['sderot', 'Sderot'],
    ['jerusalem', 'Jerusalem'], ['nuclear town', 'Dimona'],
    // Iran targets
    ['tehran', 'Tehran'], ['isfahan', 'Isfahan'], ['shiraz', 'Shiraz'], ['tabriz', 'Tabriz'],
    ['bandar abbas', 'Bandar Abbas'], ['bushehr', 'Bushehr'], ['kharg island', 'Kharg Island'],
    ['south pars', 'South Pars'],
    // Lebanon
    ['beirut', 'Beirut'], ['litani', 'Litani River'], ['south lebanon', 'South Lebanon'],
    // Others
    ['damascus', 'Damascus'], ['baghdad', 'Baghdad'], ['diego garcia', 'Diego Garcia'],
    ['strait of hormuz', 'Strait of Hormuz'], ['red sea', 'Red Sea'],
    ['gaza', 'Gaza'], ['doha', 'Doha'], ['kuwait', 'Kuwait'],
  ];

  // Also require a strike-indicating word to avoid matching city mentions in non-strike articles
  const strikeWords = ['strike', 'struck', 'hit', 'attack', 'bomb', 'missile', 'rocket',
    'drone', 'target', 'destroy', 'intercept', 'fire', 'launch', 'blast', 'explosion',
    'damage', 'killed', 'wounded', 'casualties', 'impact'];
  const hasStrikeWord = strikeWords.some(w => text.includes(w));
  if (!hasStrikeWord) return null;

  for (const [key, place] of targets) {
    if (text.includes(key) && STRIKE_LOCATIONS[key]) {
      return { coords: STRIKE_LOCATIONS[key], place };
    }
  }

  return null;
}

export default function ConflictMap({ className }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Layer groups
  const cityLayerRef = useRef<L.LayerGroup | null>(null);
  const airLayerRef = useRef<L.LayerGroup | null>(null);
  const navalLayerRef = useRef<L.LayerGroup | null>(null);
  const alertLayerRef = useRef<L.LayerGroup | null>(null);
  const strikeLayerRef = useRef<L.LayerGroup | null>(null);
  const rangeLayerRef = useRef<L.LayerGroup | null>(null);
  const toolLayerRef = useRef<L.LayerGroup | null>(null);

  // Marker tracking
  const airMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const navalMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const citiesDrawnRef = useRef(false);
  const highlightRef = useRef<L.CircleMarker | null>(null);

  // Flight trail tracking: icao24 -> array of past positions
  const flightTrailsRef = useRef<Map<string, [number, number][]>>(new Map());
  const activeTrailRef = useRef<{ id: string; polyline: L.Polyline } | null>(null);

  // Distance measurement
  const [measureMode, setMeasureMode] = useState(false);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  // Range rings toggle
  const [showRangeRings, setShowRangeRings] = useState(false);

  // Previous alert status for detecting new alerts
  const prevAlertStatusRef = useRef<string>('CLEAR');
  const arcCancellersRef = useRef<(() => void)[]>([]);

  // Data feeds
  const { data: flights } = useDataFeed<FlightData>('/api/flights', 30000);
  const { data: naval } = useDataFeed<NavalData>('/api/ships', 300000);
  const { data: alerts } = useDataFeed<AlertData>('/api/alerts', 5000);
  const { data: conflicts } = useDataFeed<ConflictEvent[]>('/api/conflicts', 180000);
  const { data: strikes } = useDataFeed<StrikeData[]>('/api/strikes', 120000);
  const { data: telegram } = useDataFeed<TelegramData>('/api/telegram', 60000);

  const [showMilAir, setShowMilAir] = useState(true);
  const [showNaval, setShowNaval] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showStrikes, setShowStrikes] = useState(true);

  useEffect(() => {
    import('leaflet').then(leaflet => { L = leaflet; setMounted(true); });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mounted || !L) return;
    const container = document.getElementById('conflict-map');
    if (!container || mapRef.current) return;

    const map = L.map('conflict-map', {
      center: [30.0, 48.0], zoom: 5, zoomControl: false, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    cityLayerRef.current = L.layerGroup().addTo(map);
    airLayerRef.current = L.layerGroup().addTo(map);
    navalLayerRef.current = L.layerGroup().addTo(map);
    alertLayerRef.current = L.layerGroup().addTo(map);
    strikeLayerRef.current = L.layerGroup().addTo(map);
    rangeLayerRef.current = L.layerGroup().addTo(map);
    toolLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      cityLayerRef.current = null;
      airLayerRef.current = null;
      navalLayerRef.current = null;
      alertLayerRef.current = null;
      strikeLayerRef.current = null;
      rangeLayerRef.current = null;
      toolLayerRef.current = null;
      measureLayerRef.current = null;
      airMarkersRef.current.clear();
      navalMarkersRef.current.clear();
      citiesDrawnRef.current = false;
      flightTrailsRef.current.clear();
    };
  }, [mounted]);

  // === DISTANCE MEASUREMENT TOOL ===
  useEffect(() => {
    if (!L || !mapRef.current || !measureLayerRef.current) return;
    const map = mapRef.current;

    if (!measureMode) {
      measurePointsRef.current = [];
      measureLayerRef.current.clearLayers();
      map.getContainer().style.cursor = '';
      return;
    }

    map.getContainer().style.cursor = 'crosshair';

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!measureMode || !L || !measureLayerRef.current) return;

      measurePointsRef.current.push(e.latlng);
      const pts = measurePointsRef.current;

      // Add point marker
      L.circleMarker(e.latlng, {
        radius: 5, color: '#ffaa00', fillColor: '#ffaa00', fillOpacity: 1, weight: 0,
      }).addTo(measureLayerRef.current);

      if (pts.length === 2) {
        const dist = pts[0].distanceTo(pts[1]);
        const distKm = (dist / 1000).toFixed(1);
        const distMi = (dist / 1609.34).toFixed(1);
        const distNm = (dist / 1852).toFixed(1);

        // Draw line
        L.polyline([pts[0], pts[1]], {
          color: '#ffaa00', weight: 2, dashArray: '8, 6', opacity: 0.8,
        }).addTo(measureLayerRef.current);

        // Distance label at midpoint
        const midLat = (pts[0].lat + pts[1].lat) / 2;
        const midLng = (pts[0].lng + pts[1].lng) / 2;
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: 'measure-label',
            html: `<div style="background:rgba(10,14,23,0.9);border:1px solid #ffaa00;padding:3px 6px;border-radius:3px;color:#ffaa00;font-family:monospace;font-size:10px;white-space:nowrap;">
              ${distKm} km | ${distMi} mi | ${distNm} nm
            </div>`,
            iconAnchor: [60, 12],
          }),
        }).addTo(measureLayerRef.current);

        // Reset for next measurement
        measurePointsRef.current = [];
      }
    };

    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, [measureMode]);

  // === FOCUS events from panels ===
  useEffect(() => {
    if (!L || !mapRef.current) return;
    const handleFocus = (e: Event) => {
      const { id, lat, lon, type } = (e as CustomEvent).detail;
      const map = mapRef.current;
      if (!map || !L) return;

      map.flyTo([lat, lon], 8, { duration: 1.2 });

      if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }

      const color = type === 'ship' ? '#00d4ff' : '#00aaff';
      const highlight = L.circleMarker([lat, lon], {
        radius: 20, color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: '4, 4', className: 'highlight-pulse',
      });
      highlight.addTo(map);
      highlightRef.current = highlight;

      const markersMap = type === 'aircraft' ? airMarkersRef.current : navalMarkersRef.current;
      const marker = markersMap.get(id);
      if (marker) marker.openPopup();

      setTimeout(() => {
        if (highlightRef.current === highlight && map) { map.removeLayer(highlight); highlightRef.current = null; }
      }, 8000);
    };

    window.addEventListener('map-focus', handleFocus);
    return () => window.removeEventListener('map-focus', handleFocus);
  }, [mounted]);

  // === CITIES — track markers for dynamic popups ===
  const cityMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  useEffect(() => {
    if (!L || !cityLayerRef.current || citiesDrawnRef.current) return;
    CITIES.forEach(city => {
      const size = city.capital ? 5 : 3;
      const color = city.country === 'Iran' ? '#ff6666' : city.country === 'Israel' ? '#66ccff' : '#999999';
      const marker = L!.circleMarker([city.lat, city.lon], { radius: size, color, fillColor: color, fillOpacity: 0.6, weight: 1 });
      marker.bindTooltip(city.name, { permanent: city.capital, direction: 'right', offset: [8, 0], className: 'city-label' });
      marker.bindPopup(''); // Will be set dynamically on click
      cityLayerRef.current!.addLayer(marker);
      cityMarkersRef.current.set(city.name, marker);
    });
    citiesDrawnRef.current = true;
  }, [mounted]);

  // Update city popups when conflict/alert data changes
  useEffect(() => {
    if (!cityMarkersRef.current.size) return;

    CITIES.forEach(city => {
      const marker = cityMarkersRef.current.get(city.name);
      if (!marker) return;

      // Find recent strikes mentioning this city/country
      const cityKey = city.name.toLowerCase();
      const countryKey = city.country.toLowerCase();
      const recentStrikes = (conflicts || [])
        .filter(e => {
          const text = `${e.description} ${e.location}`.toLowerCase();
          return text.includes(cityKey) || text.includes(countryKey);
        })
        .slice(0, 3);

      // Find active alerts for this city (Israeli cities only)
      const activeAlerts: string[] = [];
      if (alerts?.status === 'ACTIVE') {
        alerts.alerts.forEach(a => {
          a.locations.forEach(loc => {
            if (loc.toLowerCase().trim() === cityKey) {
              activeAlerts.push(`${a.type}: ${a.threat}`);
            }
          });
        });
      }

      // Build popup HTML
      let html = `<div style="font-family:monospace;font-size:11px;color:#000;min-width:220px;max-width:300px;max-height:250px;overflow-y:auto;">`;
      html += `<strong style="font-size:13px;">${city.name}</strong><br/>`;
      html += `<span style="color:#666;">${city.country}${city.capital ? ' (Capital)' : ''}</span>`;

      if (activeAlerts.length > 0) {
        html += `<div style="margin-top:6px;padding:4px 6px;background:#fff0f0;border:1px solid #ff3366;border-radius:3px;">`;
        html += `<strong style="color:#ff3366;">ACTIVE ALERTS</strong><br/>`;
        activeAlerts.forEach(a => { html += `<span style="color:#cc0000;font-size:10px;">${a}</span><br/>`; });
        html += `</div>`;
      }

      if (recentStrikes.length > 0) {
        html += `<div style="margin-top:6px;border-top:1px solid #ddd;padding-top:4px;">`;
        html += `<strong style="color:#ff6600;font-size:10px;">RECENT EVENTS</strong><br/>`;
        recentStrikes.forEach(s => {
          const timeStr = new Date(s.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          html += `<div style="margin:2px 0;font-size:10px;">`;
          html += `<span style="color:${s.type === 'STRIKE' ? '#ff3300' : s.type === 'DRONE' ? '#ff6600' : '#666'};font-weight:bold;">${s.type}</span> `;
          html += `${s.description.substring(0, 80)}${s.description.length > 80 ? '...' : ''}`;
          html += `<br/><span style="color:#999;font-size:9px;">${s.source} • ${timeStr}</span>`;
          html += `</div>`;
        });
        html += `</div>`;
      }

      if (recentStrikes.length === 0 && activeAlerts.length === 0) {
        html += `<div style="margin-top:4px;color:#999;font-size:10px;">No recent events reported</div>`;
      }

      html += `</div>`;
      marker.setPopupContent(html);
    });
  }, [conflicts, alerts]);

  // City/air/naval visibility toggles
  useEffect(() => { if (mapRef.current && cityLayerRef.current) { showCities ? mapRef.current.addLayer(cityLayerRef.current) : mapRef.current.removeLayer(cityLayerRef.current); } }, [showCities]);
  useEffect(() => { if (mapRef.current && airLayerRef.current) { showMilAir ? mapRef.current.addLayer(airLayerRef.current) : mapRef.current.removeLayer(airLayerRef.current); } }, [showMilAir]);
  useEffect(() => { if (mapRef.current && navalLayerRef.current) { showNaval ? mapRef.current.addLayer(navalLayerRef.current) : mapRef.current.removeLayer(navalLayerRef.current); } }, [showNaval]);
  useEffect(() => { if (mapRef.current && strikeLayerRef.current) { showStrikes ? mapRef.current.addLayer(strikeLayerRef.current) : mapRef.current.removeLayer(strikeLayerRef.current); } }, [showStrikes]);

  // === AIRCRAFT with trail tracking ===
  const showTrailForAircraft = useCallback((icao24: string) => {
    if (!L || !mapRef.current || !toolLayerRef.current) return;

    // Remove existing trail
    if (activeTrailRef.current) {
      try { toolLayerRef.current.removeLayer(activeTrailRef.current.polyline); } catch {}
      activeTrailRef.current = null;
    }

    const trail = flightTrailsRef.current.get(icao24);
    if (!trail || trail.length < 2) return;

    const color = '#00aaff';
    const polyline = L.polyline(trail, {
      color, weight: 1.5, opacity: 0.6, dashArray: '4, 4',
    }).addTo(toolLayerRef.current);

    activeTrailRef.current = { id: icao24, polyline };
  }, []);

  const hideTrail = useCallback(() => {
    if (activeTrailRef.current && toolLayerRef.current) {
      try { toolLayerRef.current.removeLayer(activeTrailRef.current.polyline); } catch {}
      activeTrailRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!L || !airLayerRef.current || !flights?.flights) return;

    const currentIds = new Set<string>();

    flights.flights.forEach(f => {
      const id = f.icao24;
      currentIds.add(id);
      const color = getFlightColor(f.origin);

      // Record position for trail
      if (!flightTrailsRef.current.has(id)) flightTrailsRef.current.set(id, []);
      const trail = flightTrailsRef.current.get(id)!;
      const lastPos = trail[trail.length - 1];
      if (!lastPos || Math.abs(lastPos[0] - f.lat) > 0.001 || Math.abs(lastPos[1] - f.lon) > 0.001) {
        trail.push([f.lat, f.lon]);
        if (trail.length > 100) trail.shift(); // Keep last 100 positions
      }

      // Update active trail polyline if this aircraft is selected
      if (activeTrailRef.current?.id === id) {
        showTrailForAircraft(id);
      }

      const existing = airMarkersRef.current.get(id);
      const popupContent = `
        <div style="font-family:monospace;font-size:11px;color:#000;min-width:180px;">
          <strong style="color:${color}">${f.callsign || f.icao24}</strong><br/>
          <strong>${f.type}</strong><br/>
          ${f.aircraftType ? `Platform: ${f.aircraftType}${f.registration ? ` (${f.registration})` : ''}<br/>` : ''}
          Origin: ${f.origin}<br/>
          Alt: ${f.altitude.toLocaleString()} ft<br/>
          Speed: ${f.speed} kts | Hdg: ${f.heading}°
          ${f.squawk ? `<br/>Squawk: ${f.squawk}` : ''}
          <br/><em style="color:#666;font-size:9px;">Click to show flight trail</em>
        </div>
      `;

      if (existing) {
        animateMarker(existing, f.lat, f.lon, 2000);
        existing.setIcon(L!.divIcon({
          className: 'mil-aircraft-marker',
          html: `<div style="font-size:14px;transform:rotate(${f.heading}deg);filter:drop-shadow(0 0 4px ${color});color:${color};line-height:1;transition:transform 2s ease-out;">✈</div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        }));
        existing.setPopupContent(popupContent);
      } else {
        const marker = L!.marker([f.lat, f.lon], {
          icon: L!.divIcon({
            className: 'mil-aircraft-marker',
            html: `<div style="font-size:14px;transform:rotate(${f.heading}deg);filter:drop-shadow(0 0 4px ${color});color:${color};line-height:1;transition:transform 2s ease-out;">✈</div>`,
            iconSize: [18, 18], iconAnchor: [9, 9],
          }),
        });
        marker.bindPopup(popupContent);
        marker.bindTooltip(f.callsign || f.icao24, { direction: 'top', offset: [0, -10], className: 'aircraft-label' });

        // Click to show trail, close to hide
        marker.on('click', () => showTrailForAircraft(id));
        marker.on('popupclose', () => hideTrail());

        airLayerRef.current!.addLayer(marker);
        airMarkersRef.current.set(id, marker);
      }
    });

    // Remove gone aircraft
    airMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        airLayerRef.current!.removeLayer(marker);
        airMarkersRef.current.delete(id);
        flightTrailsRef.current.delete(id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights, showTrailForAircraft, hideTrail]);

  // === NAVAL ===
  useEffect(() => {
    if (!L || !navalLayerRef.current || !naval?.ships) return;
    const currentNames = new Set<string>();
    naval.ships.forEach(ship => {
      const id = ship.name;
      currentNames.add(id);
      const color = NAVY_COLORS[ship.navy] || '#888888';
      const isSub = ship.type.toLowerCase().includes('submarine');
      const existing = navalMarkersRef.current.get(id);
      if (existing) {
        animateMarker(existing, ship.lat, ship.lon, 3000);
      } else {
        const marker = L!.marker([ship.lat, ship.lon], {
          icon: L!.divIcon({
            className: 'naval-marker',
            html: `<div style="font-size:${isSub ? '10px' : '13px'};filter:drop-shadow(0 0 4px ${color});color:${color};line-height:1;">${isSub ? '▼' : '⛴'}</div>`,
            iconSize: [16, 16], iconAnchor: [8, 8],
          }),
        });
        marker.bindPopup(`
          <div style="font-family:monospace;font-size:11px;color:#000;min-width:180px;">
            <strong style="color:${color}">${ship.name}</strong><br/>
            ${ship.hull} &bull; ${ship.class}<br/>Type: ${ship.type}<br/>Navy: ${ship.navy}<br/>
            Status: ${ship.status}<br/>Region: ${ship.region}${ship.group ? `<br/>Group: ${ship.group}` : ''}
          </div>
        `);
        marker.bindTooltip(ship.name, { direction: 'top', offset: [0, -8], className: 'naval-label' });
        navalLayerRef.current!.addLayer(marker);
        navalMarkersRef.current.set(id, marker);
      }
    });
    navalMarkersRef.current.forEach((marker, id) => {
      if (!currentNames.has(id)) { navalLayerRef.current!.removeLayer(marker); navalMarkersRef.current.delete(id); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naval]);

  // === ALERTS with missile arcs ===
  useEffect(() => {
    if (!L || !alertLayerRef.current || !mapRef.current) return;

    // Only clear layers when transitioning states, not on every poll
    // This prevents missile arcs from being wiped after 5 seconds
    const wasActive = prevAlertStatusRef.current === 'ACTIVE';
    const isActive = alerts?.status === 'ACTIVE' && alerts.alerts.length > 0;

    if (!isActive) {
      // Cancel all looping arcs
      arcCancellersRef.current.forEach(cancel => cancel());
      arcCancellersRef.current = [];
      alertLayerRef.current.clearLayers();
    }

    if (isActive) {
      // Clear and redraw alert markers (but arcs persist from initial draw)
      if (!wasActive) {
        alertLayerRef.current.clearLayers();
      }
      const alertCircle = L.circle([31.5, 34.8], {
        radius: 150000, color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.15,
        weight: 2, dashArray: '5, 10', className: 'alert-flash',
      });
      alertCircle.bindPopup(`
        <div style="font-family:monospace;font-size:11px;color:#000;">
          <strong style="color:red">ACTIVE ALERTS</strong><br/>
          ${alerts.alerts.map(a => `${a.type}: ${a.threat}`).join('<br/>')}
        </div>
      `);
      alertLayerRef.current.addLayer(alertCircle);

      alerts.alerts.forEach(alert => {
        alert.locations.forEach(loc => {
          const key = loc.toLowerCase().trim();
          const coords = ALERT_CITIES[key];
          if (coords) {
            const sirens = L!.circleMarker(coords, {
              radius: 12, color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.4, weight: 2, className: 'alert-flash',
            });
            sirens.bindPopup(`<div style="font-family:monospace;font-size:11px;color:#000;"><strong style="color:red">${alert.type}</strong><br/>${loc}<br/>${alert.threat}</div>`);
            alertLayerRef.current!.addLayer(sirens);
          }
        });
      });

      // Draw missile arcs on NEW alerts — only to specific alert cities
      if (prevAlertStatusRef.current !== 'ACTIVE') {
        const alertType = alerts.alerts[0]?.type || '';
        const isFromIran = alertType === 'MISSILE' || alerts.alerts.some(a => a.threat.toLowerCase().includes('iran') || a.threat.toLowerCase().includes('ballistic'));
        const isFromLebanon = alerts.alerts.some(a => a.threat.toLowerCase().includes('lebanon') || a.threat.toLowerCase().includes('hezbollah'));

        const origin: [number, number] = isFromIran ? [33.5, 48.0] : isFromLebanon ? [33.89, 35.50] : [33.5, 48.0];

        // Collect all unique alert city coordinates
        const targetCoords: [number, number][] = [];
        const seenCoords = new Set<string>();
        alerts.alerts.forEach(alert => {
          alert.locations.forEach(loc => {
            const coords = ALERT_CITIES[loc.toLowerCase().trim()];
            if (coords) {
              const key = `${coords[0]},${coords[1]}`;
              if (!seenCoords.has(key)) {
                seenCoords.add(key);
                targetCoords.push(coords);
              }
            }
          });
        });

        // If no specific cities found, fall back to central Israel
        if (targetCoords.length === 0) {
          targetCoords.push([31.5, 34.8]);
        }

        // Draw one arc per target city
        targetCoords.forEach((coords, i) => {
          setTimeout(() => {
            if (alertLayerRef.current) {
              const c = drawMissileArc(mapRef.current!, origin, coords, '#ff3366', alertLayerRef.current);
              arcCancellersRef.current.push(c);
            }
          }, i * 500);
        });
      }
    }
    prevAlertStatusRef.current = alerts?.status || 'CLEAR';
  }, [alerts]);

  // === STRIKE MARKERS from conflict feed, strikes API, AND Telegram ===
  useEffect(() => {
    if (!L || !strikeLayerRef.current || !mapRef.current) return;

    strikeLayerRef.current.clearLayers();

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const plotted = new Set<string>(); // Dedup by title prefix
    const plottedLocations = new Set<string>(); // Dedup Telegram by location

    // Merge news data sources into a common format
    const allStrikes: { title: string; date: string; source: string; type: string; fromTelegram?: boolean }[] = [];

    // From conflicts API (priority — plotted first)
    if (conflicts) {
      conflicts.forEach(e => {
        if (e.type === 'STRIKE' || e.type === 'DRONE') {
          allStrikes.push({ title: e.description, date: e.date, source: e.source, type: e.type });
        }
      });
    }

    // From strikes API (priority — plotted first)
    if (strikes) {
      strikes.forEach(s => {
        if (s.category === 'MISSILE' || s.category === 'STRIKE' || s.category === 'DRONE') {
          allStrikes.push({ title: s.title, date: s.date, source: s.source, type: s.category });
        }
      });
    }

    // From Telegram posts (added last so they only fill gaps)
    if (telegram?.posts) {
      telegram.posts.forEach(post => {
        const t = post.text.toLowerCase();
        // Only include posts that mention strike-related keywords
        const strikeWords = ['strike', 'struck', 'hit', 'attack', 'bomb', 'missile', 'rocket',
          'drone', 'target', 'destroy', 'intercept', 'fire', 'launch', 'blast', 'explosion',
          'airstrike', 'killed', 'impact', 'barrage'];
        if (!strikeWords.some(w => t.includes(w))) return;

        let type = 'STRIKE';
        if (t.match(/missile|ballistic/)) type = 'MISSILE';
        else if (t.match(/drone|uav|shahed/)) type = 'DRONE';
        else if (t.match(/rocket/)) type = 'ROCKET';
        else if (t.match(/airstrike|air strike/)) type = 'AIRSTRIKE';

        allStrikes.push({
          title: post.text.length > 200 ? post.text.substring(0, 200) + '...' : post.text,
          date: post.date,
          source: `Telegram: ${post.channelLabel}`,
          type,
          fromTelegram: true,
        });
      });
    }

    allStrikes.forEach(event => {
      const t = new Date(event.date).getTime();
      if (isNaN(t) || t < cutoff) return;

      // Dedup by title
      const key = event.title.toLowerCase().substring(0, 40);
      if (plotted.has(key)) return;

      const geo = geocodeStrike(event.title, '');
      if (!geo) return;

      // If this is from Telegram, skip if a news source already has a marker at this location
      if (event.fromTelegram && plottedLocations.has(geo.place.toLowerCase())) return;

      plotted.add(key);
      plottedLocations.add(geo.place.toLowerCase());

      const pos: [number, number] = [
        geo.coords[0] + (Math.random() - 0.5) * 0.15,
        geo.coords[1] + (Math.random() - 0.5) * 0.15,
      ];

      const timeStr = new Date(event.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const typeColor = event.type === 'MISSILE' ? '#ff0044' : event.type === 'DRONE' ? '#ff6600' : '#ff3300';
      const sourceTag = event.fromTelegram ? '📡 ' : '';
      const popupHtml = `
        <div style="font-family:monospace;font-size:11px;color:#000;min-width:220px;max-width:300px;">
          <strong style="color:${typeColor};font-size:12px;">${event.type} — ${geo.place}</strong><br/>
          <div style="margin:4px 0;line-height:1.4;">${event.title}</div>
          <em style="color:#666;font-size:9px;">${sourceTag}${event.source} • ${timeStr}</em>
        </div>
      `;

      const marker = L!.marker(pos, {
        icon: L!.divIcon({
          className: 'strike-marker',
          html: `<div style="width:22px;height:22px;position:relative;cursor:pointer;">
            <div style="position:absolute;inset:0;background:radial-gradient(circle,${typeColor} 25%,${typeColor}44 55%,transparent 70%);border-radius:50%;animation:alert-flash 1.5s ease-in-out infinite;"></div>
            <div style="position:absolute;inset:2px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:bold;text-shadow:0 0 4px ${typeColor};">✦</div>
          </div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        }),
      }).addTo(strikeLayerRef.current!);
      marker.bindPopup(popupHtml);
    });

    console.log(`[MAP] Plotted ${plotted.size} strike markers`);
  }, [conflicts, strikes, telegram]);

  // === MISSILE RANGE RINGS ===
  useEffect(() => {
    if (!L || !rangeLayerRef.current || !mapRef.current) return;
    rangeLayerRef.current.clearLayers();

    if (!showRangeRings) return;

    IRAN_LAUNCH_SITES.forEach(site => {
      // Range circle
      const circle = L!.circle([site.lat, site.lon], {
        radius: site.range * 1000,
        color: '#ff336644',
        fillColor: '#ff336611',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '10, 8',
      });
      circle.bindTooltip(`${site.name}<br/>${site.range}km range`, { className: 'city-label' });
      rangeLayerRef.current!.addLayer(circle);

      // Launch site marker
      const marker = L!.circleMarker([site.lat, site.lon], {
        radius: 4, color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.8, weight: 1,
      });
      marker.bindTooltip(site.name, { className: 'city-label', direction: 'right', offset: [6, 0] });
      rangeLayerRef.current!.addLayer(marker);
    });
  }, [showRangeRings]);

  return (
    <div className={`panel ${className || ''} flex flex-col`}>
      <div className="panel-header shrink-0 flex-wrap-reverse">
        <span className="status-dot" />
        <span className="shrink-0">THEATER MAP</span>
        <div className="ml-auto flex items-center gap-1 flex-wrap justify-end">
          <button onClick={() => setShowMilAir(!showMilAir)} className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: showMilAir ? '#00aaff' : 'var(--text-secondary)', borderColor: showMilAir ? '#00aaff' : 'var(--border-color)', background: showMilAir ? 'rgba(0,170,255,0.1)' : 'transparent' }}>
            ✈ AIR {flights?.military || 0}
          </button>
          <button onClick={() => setShowNaval(!showNaval)} className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: showNaval ? '#00d4ff' : 'var(--text-secondary)', borderColor: showNaval ? '#00d4ff' : 'var(--border-color)', background: showNaval ? 'rgba(0,212,255,0.1)' : 'transparent' }}>
            ⛴ NAV {naval?.ships?.length || 0}
          </button>
          <button onClick={() => setShowStrikes(!showStrikes)} className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: showStrikes ? '#ff6600' : 'var(--text-secondary)', borderColor: showStrikes ? '#ff6600' : 'var(--border-color)', background: showStrikes ? 'rgba(255,102,0,0.1)' : 'transparent' }}>
            💥 STRIKES
          </button>
          <button onClick={() => setShowRangeRings(!showRangeRings)} className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: showRangeRings ? '#ff3366' : 'var(--text-secondary)', borderColor: showRangeRings ? '#ff3366' : 'var(--border-color)', background: showRangeRings ? 'rgba(255,51,102,0.1)' : 'transparent' }}>
            ◎ RANGE
          </button>
          <button onClick={() => setShowCities(!showCities)} className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: showCities ? '#999' : 'var(--text-secondary)', borderColor: showCities ? '#666' : 'var(--border-color)', background: showCities ? 'rgba(150,150,150,0.1)' : 'transparent' }}>
            CITIES
          </button>
          <button onClick={() => { setMeasureMode(!measureMode); if (measureMode && measureLayerRef.current) measureLayerRef.current.clearLayers(); }}
            className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: measureMode ? '#ffaa00' : 'var(--text-secondary)', borderColor: measureMode ? '#ffaa00' : 'var(--border-color)', background: measureMode ? 'rgba(255,170,0,0.15)' : 'transparent' }}>
            📏 DIST
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        {!mounted ? <div className="loading-shimmer w-full h-full" /> : <div id="conflict-map" className="w-full h-full" />}
        {measureMode && (
          <div className="absolute top-2 left-2 z-[1000] text-[9px] px-2 py-1 rounded" style={{ background: 'rgba(10,14,23,0.9)', border: '1px solid #ffaa00', color: '#ffaa00' }}>
            MEASURE MODE — Click two points to measure distance. Click DIST again to exit.
          </div>
        )}
      </div>

      <style jsx global>{`
        .city-label, .aircraft-label, .naval-label {
          background: rgba(10, 14, 23, 0.9) !important;
          border: 1px solid rgba(30, 58, 95, 0.5) !important;
          color: #94a3b8 !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 9px !important;
          padding: 1px 4px !important;
          border-radius: 2px !important;
          box-shadow: none !important;
        }
        .city-label::before, .aircraft-label::before, .naval-label::before {
          border-right-color: rgba(30, 58, 95, 0.5) !important;
        }
        .aircraft-label { color: #00aaff !important; }
        .naval-label { color: #00d4ff !important; }
        .mil-aircraft-marker, .naval-marker, .strike-marker, .measure-label { background: none !important; border: none !important; }
        .missile-arc { filter: drop-shadow(0 0 4px #ff3366); }
      `}</style>
    </div>
  );
}
