// Per-conflict configuration types.
//
// A ConflictConfig holds EVERY value the dashboard currently hardcodes for the
// Iran/Israel theater, so the same UI + API routes can be repointed at a
// different conflict (Russia/Ukraine) by swapping the config object.
//
// This module is plain TS (no React, no browser APIs) so it can be imported by
// BOTH client components (via the conflict context) and server API routes
// (via the ?conflict= query param). Keep it free of client-only imports.

export type ConflictKey = 'iran-israel' | 'russia-ukraine';

export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  country: string;
  capital: boolean;
}

export interface LaunchSite {
  name: string;
  lat: number;
  lon: number;
  range: number; // km
}

export interface BBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface RegionBox extends BBox {
  name: string;
}

export interface TimeZoneEntry {
  label: string;
  zone: string;
  flag: string;
}

export interface TelegramChannel {
  name: string;
  label: string;
  color: string;
}

export interface NewsFeedSource {
  url: string;
  name: string;
  section?: string;
  // If true, items from this source bypass the relevance keyword filter
  // (used for outlets that are inherently on-topic for this conflict).
  unfiltered?: boolean;
}

export interface CountryQuery {
  country: string;
  flag: string;
  query: string;
}

export interface StaticShip {
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
}

export interface ColorMatchRule {
  // Substring matched against a flight "origin" string; first match wins.
  match: string;
  color: string;
}

export interface MissileOrigin {
  // Keyword found in an alert threat string that identifies the launch origin.
  match: string;
  coords: [number, number];
}

// ---- Client-facing config (read via the conflict context in the browser) ----
export interface ClientConfig {
  // Map
  mapCenter: [number, number];
  mapZoom: number;
  cities: MapCity[];
  // country -> city-dot color; `default` used for non-belligerent countries
  cityColors: Record<string, string>;
  launchSites: LaunchSite[];
  // geocode table: lowercased key -> coordinates
  strikeLocations: Record<string, [number, number]>;
  // ordered [key, DisplayName] pairs for strike geocoding (specific places only)
  strikeTargets: [string, string][];
  // lowercased alert-city name -> coordinates (for siren markers / arcs)
  alertCities: Record<string, [number, number]>;
  // fallback center used when an alert has no resolvable city
  alertFallbackCenter: [number, number];
  // default launch origin for missile arcs + named origins by threat keyword
  defaultMissileOrigin: [number, number];
  missileOrigins: MissileOrigin[];
  // flight marker colors by origin substring
  flightColors: ColorMatchRule[];
  // navy -> color (map markers)
  navyColors: Record<string, string>;

  // ThreatClock
  timeZones: TimeZoneEntry[];

  // NewsFeed presentational source colors (falls back to a neutral gray)
  sourceColors: Record<string, string>;

  // NavalPanel
  navyOrder: string[];
  maritimeRegions: string[];

  // RegionalAlertsPanel
  countryColors: Record<string, string>;

  // SatellitePanel reverse-geocode boxes + default label
  regionBoxes: RegionBox[];
  defaultRegion: string;

  // AlertsPanel branding
  alertSystemName: string;   // e.g. "Pikud HaOref"
  alertStatusTitle: string;  // e.g. "ISRAEL ALERT STATUS"

  // Real-time drone/threat tracker layer on the map (only some theaters have a source)
  hasDroneTracker: boolean;
}

// ---- Server-facing config (read in API routes by ?conflict= param) ----
export interface ServerConfig {
  // strikes route
  strikeQueries: string[];
  countryAttribution: { match: string[]; country: string }[];
  defaultCountry: string;

  // conflicts route (location string only — the map geocodes coords separately)
  conflictQueries: string[];
  conflictLocations: { match: string[]; location: string }[];

  // regional-alerts route
  countryQueries: CountryQuery[];

  // polymarket route
  polymarketKeywords: RegExp;
  polymarketExclude: RegExp;

  // fires route bounding box
  firesBBox: BBox;

  // flights route
  flightsCenter: { lat: number; lon: number; dist: number };
  flightsBBox: BBox;

  // news route
  newsFeeds: NewsFeedSource[];
  newsRelevanceKeywords: RegExp;

  // telegram route
  telegramChannels: TelegramChannel[];

  // ships route
  ships: StaticShip[];
  shipRegions: string[];

  // alerts route: which provider drives the air-raid feed
  alertProvider: 'tzevaadom' | 'alertsua';

  // drones route: real-time drone/missile track provider (undefined = none)
  droneProvider?: 'neptun';
}

export interface ConflictConfig {
  key: ConflictKey;
  // Short label for the toggle, e.g. "IRAN / ISRAEL"
  label: string;
  // Longer theater description shown in the header subtitle
  theater: string;
  client: ClientConfig;
  server: ServerConfig;
}
