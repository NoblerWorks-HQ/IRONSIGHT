export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category?: string;
}

export interface OilPrice {
  type: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  updated: string;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface CurrencyRate {
  pair: string;
  rate: number;
  change: number;
}

export interface ConflictEvent {
  id: string;
  date: string;
  type: string;
  location: string;
  lat: number;
  lon: number;
  description: string;
  source: string;
  fatalities?: number;
}

export interface FlightData {
  callsign: string;
  origin: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  speed: number;
  type?: string;
}

export interface ShipData {
  name: string;
  mmsi: string;
  type: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  destination?: string;
}

export interface SeismicEvent {
  id: string;
  magnitude: number;
  location: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  type: string;
}

export interface GasPrice {
  state: string;
  regular: number;
  midgrade: number;
  premium: number;
  diesel: number;
}

export interface CyberEvent {
  date: string;
  actor: string;
  target: string;
  type: string;
  description: string;
  source: string;
}

export interface HumanitarianReport {
  title: string;
  date: string;
  country: string;
  source: string;
  url: string;
  type: string;
}

export interface NuclearFacility {
  name: string;
  country: string;
  type: string;
  status: string;
  lat: number;
  lon: number;
}

export type ThreatLevel = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface DashboardMetrics {
  oilPrice: number;
  oilChange: number;
  threatLevel: ThreatLevel;
  activeConflicts: number;
  daysSinceEscalation: number;
  avgGasPrice: number;
  gasChange: number;
}
