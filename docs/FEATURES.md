# Feature Catalogue

The canonical list of user-visible IRONSIGHT features. Update it in the same commit as any user-visible change (a new panel, map layer, feed or API route, or a change to what one shows). The README "Features" section is the short pitch; this file is the full list, and the code wins where they differ.

Every panel and map layer polls a Next API route through `useConflictFeed` ([src/lib/hooks.ts](../src/lib/hooks.ts)), which appends `?conflict=<key>` so each route serves the selected theater. Theater-specific settings (feeds, channels, keywords, bounding boxes, ships, clocks) live in one config per conflict under [src/lib/conflicts/](../src/lib/conflicts/).

## Dashboard shell

- **Theater toggle** - segmented control in the header switches the whole dashboard between Iran / Israel (default) and Russia / Ukraine; the choice is stored in `localStorage` (`ironsight-conflict`) and restored on reload. [src/components/ConflictToggle.tsx](../src/components/ConflictToggle.tsx), [src/lib/conflicts/context.tsx](../src/lib/conflicts/context.tsx)
- **Themes** - header control beside the theater toggle: one button cycles six accent presets (Cyan default, Amber, NVG, Red, Violet, Ice; swatch always shown, name on wide screens and in the accessible name), one flips light / dark mode. Stored in `localStorage` (`ironsight-theme`, `ironsight-mode`) and applied by an inline script before hydration, so there is no flash; with nothing saved the page is the original dark cyan. The accent is chrome only: alert red, ok green, warning amber, high orange and the data colours (aircraft blue, naval cyan, purple) keep their meaning in every preset and only change shade in light mode. Colours: `[data-theme]` / `[data-mode]` blocks in [src/app/globals.css](../src/app/globals.css); presets: [src/lib/theme.ts](../src/lib/theme.ts); WCAG AA for every preset in both modes is pinned by `tests/theme-contrast.test.mjs`. [src/components/ThemeSwitcher.tsx](../src/components/ThemeSwitcher.tsx), [src/lib/theme-context.tsx](../src/lib/theme-context.tsx)
- **App icon** - the landing site's red crosshair mark as `src/app/icon.svg` (strokes thickened at 24 px and below), `apple-icon.png` (180 px) and `favicon.ico` (16 / 32 / 48, with a thicker 16 px frame).
- **Theater clocks** - Zulu (UTC) time plus six per-theater city clocks (Iran / Israel: DC, LON, TLV, THR, RYD and a clock labelled MSK; Russia / Ukraine: DC, LON, KYIV, MSK, WAW, BER), ticking every second. [src/components/panels/ThreatClock.tsx](../src/components/panels/ThreatClock.tsx)
- **Header metrics bar** - WTI, Brent and natural gas prices with daily change (from `api/oil`), plus a THREAT LEVEL tile that is a fixed "ELEVATED" label, not computed from any feed. [src/components/panels/MetricsBar.tsx](../src/components/panels/MetricsBar.tsx)
- **Session uptime and status bar** - session timer and LIVE indicator in the header; a footer listing feeds and the theater's alert system name. [src/app/page.tsx](../src/app/page.tsx)

## Map

- **Theater map** - Leaflet map centered on the selected theater (max zoom 8), with military aircraft and their trails (`api/flights`), naval vessels (`api/ships`), air-raid alerts with animated missile-trajectory arcs (`api/alerts`), strike markers placed at the configured coordinates of a known location named in conflict events, strike reports and Telegram posts (labelled approximate, not the incident site) (`api/conflicts`, `api/strikes`, `api/telegram`), drone / missile tracks (`api/drones`), and city markers whose popups list active alerts and recent strikes there. Clicking an aircraft or ship in its panel focuses it on the map. [src/components/map/ConflictMap.tsx](../src/components/map/ConflictMap.tsx)
- **Land, coastlines and borders** - no basemap tiles (CARTO's free tiles now need a key): Natural Earth 1:50m countries from the `world-atlas` package, lazy-loaded with the map and drawn as SVG under every overlay; ocean, land, coast and border colours are theme variables (`--map-*`), so both modes and every accent restyle the map. Credited "Natural Earth" on the map. The map makes no third-party requests. [src/components/map/ConflictMap.tsx](../src/components/map/ConflictMap.tsx)
- **Range rings** - toggleable circles showing the configured range (km) of each site in the theater config. [src/components/map/ConflictMap.tsx](../src/components/map/ConflictMap.tsx)
- **Distance measurement** - measure mode: click two points to draw a line with its distance label. [src/components/map/ConflictMap.tsx](../src/components/map/ConflictMap.tsx)

## Alerts and threats

- **Air-raid alert status** - active sirens: Israeli Home Front Command alerts via the Tzeva Adom mirror (Hebrew translated by dictionary, then Google Translate), or Ukrainian oblast air-raid alerts via alerts.com.ua. Alerts stay visible for 90 seconds after they clear upstream; categorized as missile, rocket, drone, mortar, infiltration, earthquake, tsunami, hazmat or generic alert. Optional audio cue (Web Audio, no sound files) with a preview ping when enabled. Polls every 15 s. [src/components/panels/AlertsPanel.tsx](../src/components/panels/AlertsPanel.tsx), [src/app/api/alerts/route.ts](../src/app/api/alerts/route.ts), [src/lib/generateAlert.ts](../src/lib/generateAlert.ts)
- **Live drone / missile tracker** (Russia / Ukraine only) - Neptun tracks classified as Shahed drone, recon UAV, ballistic missile, guided bomb (KAB), cruise missile, launch / takeoff or air threat, with heading, count, confidence, a trail of up to 20 positions and a ballistic-threat flag; Ukrainian text translated to English (cached). Iran / Israel returns an empty list. Polls every 20 s. [src/app/api/drones/route.ts](../src/app/api/drones/route.ts)
- **Regional threat monitor** - per-country Google News headlines for the theater's neighbours, each headline scored critical / high / medium / low by keyword, and each country given a level (CRITICAL, ALERT, MONITORING, CLEAR) from the last 12 hours; most active first. Polls every 60 s. [src/components/panels/RegionalAlertsPanel.tsx](../src/components/panels/RegionalAlertsPanel.tsx), [src/app/api/regional-alerts/route.ts](../src/app/api/regional-alerts/route.ts)

## Intelligence feeds

- **Live intel feed** - per-theater RSS / Atom news (up to 15 items per feed), relevance-filtered by theater keywords (some sources pass unfiltered), sports / entertainment noise removed, Hebrew titles translated, deduplicated, newest 100. Polls every 90 s. [src/components/panels/NewsFeed.tsx](../src/components/panels/NewsFeed.tsx), [src/app/api/news/route.ts](../src/app/api/news/route.ts)
- **Telegram OSINT** - latest 3 posts from each configured public channel, scraped from Telegram's embed pages; non-Latin text auto-translated. Polls every 60 s. [src/components/panels/TelegramPanel.tsx](../src/components/panels/TelegramPanel.tsx), [src/app/api/telegram/route.ts](../src/app/api/telegram/route.ts)
- **Conflict monitor** - Google News results for the theater's conflict queries, typed STRIKE, DEFENSE, MILITARY, DIPLOMATIC, NUCLEAR, DRONE or REPORT and tagged with a location by keyword rules. Polls every 3 min. [src/components/panels/ConflictFeed.tsx](../src/components/panels/ConflictFeed.tsx), [src/app/api/conflicts/route.ts](../src/app/api/conflicts/route.ts)
- **Missile / strike tracker** - Google News strike queries classified INTERCEPTION, MISSILE, DRONE, AIRSTRIKE, ROCKET, STRIKE or REPORT with a severity and an attributed country; newest 25. Polls every 2 min. [src/components/panels/StrikesPanel.tsx](../src/components/panels/StrikesPanel.tsx), [src/app/api/strikes/route.ts](../src/app/api/strikes/route.ts)

## Military tracking

- **Military airspace** - adsb.lol military feed filtered to the theater bounding box, merged with a regional feed filtered by military / interesting flags, military callsigns (known prefix + mission number), exact ICAO type designators and US military hex ranges; each aircraft classified by role. Polls every 3 min. [src/components/panels/FlightsPanel.tsx](../src/components/panels/FlightsPanel.tsx), [src/app/api/flights/route.ts](../src/app/api/flights/route.ts)
- **Naval tracker** - a curated, static list of known vessel positions from public reports in each theater config (no live AIS feed; positions approximate), grouped by region (Persian Gulf, Red Sea, Eastern Med, Arabian Sea; or Black Sea, Sea of Azov, Eastern Med, Kerch Strait). [src/components/panels/NavalPanel.tsx](../src/components/panels/NavalPanel.tsx), [src/app/api/ships/route.ts](../src/app/api/ships/route.ts)
- **Satellite thermal detect** - NASA FIRMS VIIRS 24-hour global fire CSV filtered to the theater bounding box, top 100 by fire radiative power, with intensity (low to extreme) and a "possible explosion" flag for very high FRP and brightness. Polls every 10 min. [src/components/panels/SatellitePanel.tsx](../src/components/panels/SatellitePanel.tsx), [src/app/api/fires/route.ts](../src/app/api/fires/route.ts)

## Markets

- **Defense and markets** - Yahoo Finance quotes for LMT, RTX, NOC, BA, GD, LHX, S&P 500, Dow, VIX, gold and the US Dollar Index (same for both theaters). Polls every 10 min. [src/components/panels/MarketsPanel.tsx](../src/components/panels/MarketsPanel.tsx), [src/app/api/markets/route.ts](../src/app/api/markets/route.ts)
- **Energy markets** - WTI, Brent, natural gas, heating oil and RBOB gasoline futures via Yahoo Finance. Polls every 10 min. [src/components/panels/OilPanel.tsx](../src/components/panels/OilPanel.tsx), [src/app/api/oil/route.ts](../src/app/api/oil/route.ts)
- **Crypto markets** - BTC, ETH, SOL and BNB prices with 24h change via CoinGecko. Polls every 10 min. [src/components/panels/CryptoPanel.tsx](../src/components/panels/CryptoPanel.tsx), [src/app/api/crypto/route.ts](../src/app/api/crypto/route.ts)
- **Prediction markets** - top 20 open Polymarket markets matching the theater's keywords (minus exclusions), with outcome odds, volume, liquidity and 24h change. Polls every 10 min. [src/components/panels/PolymarketPanel.tsx](../src/components/panels/PolymarketPanel.tsx), [src/app/api/polymarket/route.ts](../src/app/api/polymarket/route.ts)

## API routes

One Next route per upstream feed, under `src/app/api/<name>/route.ts`, all `GET`, all no-key. Response shapes are in [src/lib/types/api.ts](../src/lib/types/api.ts). "Per theater" means the route reads `?conflict=`.

| Route | Upstream | Per theater | Used by | Client poll |
|---|---|---|---|---|
| `api/alerts` | Tzeva Adom (`api.tzevaadom.co.il`) or alerts.com.ua | yes | AlertsPanel, map | 15 s |
| `api/conflicts` | Google News RSS | yes | ConflictFeed, map | 3 min |
| `api/crypto` | CoinGecko | no | CryptoPanel | 10 min |
| `api/drones` | Neptun (`neptun.in.ua`), Russia / Ukraine only | yes | AlertsPanel, map | 20 s |
| `api/fires` | NASA FIRMS VIIRS CSV | yes | SatellitePanel | 10 min |
| `api/flights` | adsb.lol (`/v2/mil` + regional radius) | yes | FlightsPanel, map | 3 min |
| `api/markets` | Yahoo Finance chart API | no | MarketsPanel | 10 min |
| `api/news` | Theater RSS / Atom feeds, Google Translate | yes | NewsFeed | 90 s |
| `api/oil` | Yahoo Finance chart API | no | OilPanel, MetricsBar | 10 min |
| `api/polymarket` | Polymarket Gamma API | yes | PolymarketPanel | 10 min |
| `api/regional-alerts` | Google News RSS, per country | yes | RegionalAlertsPanel | 60 s |
| `api/ships` | None - static list in the theater config | yes | NavalPanel, map | 5 min |
| `api/strikes` | Google News RSS | yes | StrikesPanel, map | 2 min |
| `api/telegram` | Telegram public embed pages (`t.me/<channel>/<id>?embed=1`), Google Translate | yes | TelegramPanel, map | 60 s |

## Known mismatches in the code (not fixed here)

- The footer in [src/app/page.tsx](../src/app/page.tsx) lists GDELT, OPENSKY and OCHA as feeds and "ALERTS: 5s | NEWS: 2m | MARKETS: 5m"; no route uses those three sources, and the real polls are 15 s, 90 s and 10 min.
- The Iran / Israel clock labelled MSK uses the `Asia/Shanghai` zone and a China flag ([src/lib/conflicts/iran-israel.ts](../src/lib/conflicts/iran-israel.ts)).
- The header THREAT LEVEL is hard-coded "ELEVATED".
