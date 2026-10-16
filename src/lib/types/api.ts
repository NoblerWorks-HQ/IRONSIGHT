// Shapes of the /api/* JSON responses, defined once. The route handlers build
// these; the panels and ConflictMap read them. Type-only: nothing here exists
// at runtime, so moving a definition here cannot change behaviour.

// --- /api/telegram ---
export interface TelegramPost {
  channel: string;
  channelLabel: string;
  color: string;
  postId: number;
  text: string;
  date: string;
  url: string;
}
export interface TelegramData {
  posts: TelegramPost[];
  channels: string[];
  updated: string;
}

// --- /api/regional-alerts ---
export interface CountryEvent {
  title: string;
  source: string;
  time: string;
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hoursAgo: number;
}
export interface CountryAlert {
  name: string;
  flag: string;
  events: CountryEvent[];
  level: string;
}
export interface RegionalData {
  alerts: CountryAlert[];
  updated: string;
}

// --- /api/ships ---
export interface NavalVessel {
  name: string;
  hull: string;
  type: string;
  class: string;
  navy: string;
  lat: number;
  lon: number;
  status: string;
  region: string;
  lastReported: string;
  group?: string;
}
export interface NavalData {
  totalTracked: number;
  ships: NavalVessel[];
  updated: string;
  note: string;
}

// --- /api/strikes (the response is a bare array) ---
export interface StrikeEvent {
  id: string;
  date: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  source: string;
  url: string;
  country: string;
}

// --- /api/drones ---
export interface Drone {
  id: string;
  type: string; // raw threat_type
  label: string; // display label, e.g. "Shahed Drone"
  color: string;
  lat: number;
  lng: number;
  heading: number; // degrees
  count: number;
  place: string; // translated destination/place
  text: string; // translated description
  time: string;
  confidence: number; // 0-100
  trail: [number, number][];
}
export interface DroneData {
  drones: Drone[];
  count: number;
  ballisticThreat: boolean;
  source: string | null;
}

// --- /api/alerts ---
export interface AlertEvent {
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
export interface AlertData {
  status: 'ACTIVE' | 'CLEAR';
  activeCount: number;
  alerts: AlertEvent[];
  lastChecked: string;
}

// --- /api/flights ---
export interface MilFlight {
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
  description: string;
  squawk: string;
  isMilitary: boolean;
  isInteresting: boolean;
}
export interface FlightData {
  total: number;
  military: number;
  flights: MilFlight[];
  source: string;
  updated: string;
}

// --- /api/oil ---
export interface OilData {
  type: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  error?: boolean;
}
