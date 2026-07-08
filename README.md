<div align="center">

<a href="https://noblerworks.com/"><img src="https://raw.githubusercontent.com/NoblerWorks-HQ/IRONSIGHT/main/nobler-works-banner.JPG" alt="Nobler Works" width="400"></a>

### Built by [Nobler Works](https://noblerworks.com/)

We build OSINT tools, real-time dashboards, and custom software for clients who need to move fast and see clearly.<br>
If you want something like IRONSIGHT built for your domain, [get in touch](https://noblerworks.com/).

[![Website](https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://noblerworks.com/)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Nobler_Works)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@NoblerWorks)
[![TikTok](https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white)](https://www.tiktok.com/@noblerworks)
[![Threads](https://img.shields.io/badge/Threads-000000?style=for-the-badge&logo=threads&logoColor=white)](https://www.threads.com/@noblerworks)

</div>

---

# IRONSIGHT

![IRONSIGHT Dashboard](https://raw.githubusercontent.com/NoblerWorks-HQ/IRONSIGHT/main/ironsight2.png)

Real-time OSINT command center for monitoring active conflicts. A single dashboard that aggregates open-source intelligence from news, Telegram, military tracking, financial markets, satellite thermal data, and live air-threat feeds.

**Two theaters, one dashboard.** A toggle in the header flips the entire dashboard between:

- **Iran / Israel** — the Middle East theater (default)
- **Russia / Ukraine** — the Eastern Europe theater

Every panel, map layer, and data feed re-points to the selected conflict. Your choice is remembered across reloads.

Built with Next.js, TypeScript, Tailwind CSS, and Leaflet. **No API keys required. Completely free to run.**

> IRONSIGHT does not own, generate, or claim credit for any of the underlying data. It is a viewer that surfaces publicly available, third-party, open-source feeds — all of which belong to and are credited to their respective providers (see [Data Sources](#data-sources) and [Credits & Attribution](#credits--attribution)).

## Features

- **Conflict Toggle** — Switch the whole dashboard between the Iran/Israel and Russia/Ukraine theaters; selection persists in the browser
- **Live Intel Feed** — Per-theater RSS news aggregation with relevance filtering and sports/entertainment noise removal
- **Telegram OSINT** — Public Telegram channels scraped in real time with auto-translation (Hebrew/Arabic/Farsi and Ukrainian/Russian Cyrillic)
- **Theater Map** — Interactive Leaflet map with military aircraft, naval vessels, strike markers from news and Telegram, missile trajectory arcs, range rings, country-border overlay, and a distance-measurement tool
- **Live Drone / Missile Tracker** *(Russia/Ukraine)* — Real-time Shahed drone, cruise/ballistic missile, and glide-bomb (KAB) tracks with heading, movement trails, and confidence, rendered on the map and listed in the alert panel
- **Air-Raid Alert Status** — Israeli Home Front Command (Pikud HaOref) sirens for the Middle East, and Ukrainian oblast air-raid alerts for Eastern Europe, with audio notifications and on-map sirens/arcs
- **Conflict Monitor** — Categorized events (strikes, defense, diplomatic, nuclear) with per-theater geocoding
- **Missile / Strike Tracker** — Weapon-type classification and severity scoring
- **Regional Threat Monitor** — Per-country threat levels across the theater's neighbors
- **Military Airspace** — Live military aircraft tracking via adsb.lol, region-filtered per theater
- **Naval Tracker** — Known vessel positions (Persian Gulf / Red Sea / Eastern Med, or Black Sea / Sea of Azov)
- **Defense & Markets** — Defense-contractor stocks, indices, VIX, gold, USD via Yahoo Finance
- **Crypto Markets** — Bitcoin, Ethereum, Solana, BNB with 24h price changes
- **Prediction Markets** — Live Polymarket odds relevant to the selected conflict
- **Energy Markets** — WTI, Brent, natural gas, heating oil, gasoline via Yahoo Finance
- **Satellite Thermal Detect** — NASA FIRMS fire/explosion detection, region-filtered per theater

## Data Sources

**All data comes from free, publicly accessible endpoints and requires no API keys.** None of it is owned by this project — see [Credits & Attribution](#credits--attribution).

### Live APIs & Feeds

| Service | Data | Provider | Cost |
|---------|------|----------|------|
| Yahoo Finance | Stocks, indices, commodities, oil futures | Yahoo | Free, no key |
| CoinGecko | Cryptocurrency prices (BTC, ETH, SOL, BNB) | CoinGecko | Free, no key |
| Polymarket | Prediction-market odds | Polymarket (Gamma API) | Free, no key |
| NASA FIRMS | Fire / thermal-anomaly satellite data | NASA | Free, no key |
| adsb.lol | Military aircraft ADS-B tracking | Community ADS-B network | Free, no key |
| Tzeva Adom | Israeli missile/rocket/drone alerts | Community mirror of Pikud HaOref | Free, no key |
| alerts.com.ua | Ukrainian oblast air-raid alerts (EN names) | alerts.com.ua | Free, no key |
| Neptun | Ukraine real-time drone/missile/KAB tracks | neptun.in.ua | Free, no key |
| Google News RSS | Keyword/location-scoped news aggregation | Google | Free, no key |
| Google Translate | Hebrew/Arabic/Farsi + Ukrainian/Russian translation | Google (unofficial) | Free, no key |
| Telegram | Public channel posts via embed scraping | Telegram | Free, no key |

### Map

| Layer | Provider | License |
|-------|----------|---------|
| Dark basemap tiles | [CARTO](https://carto.com/) Dark Matter, data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | ODbL / CARTO attribution |
| Country border lines | [Natural Earth](https://www.naturalearthdata.com/) `ne_50m_admin_0_boundary_lines_land` | Public domain |
| Map engine | [Leaflet](https://leafletjs.com/) | BSD-2-Clause |

### News RSS Feeds

<details>
<summary><strong>Iran / Israel theater</strong></summary>

BBC Middle East, New York Times Middle East, Al Jazeera, Reuters World, CNN Middle East, Fox News World, Wall Street Journal, Times of Israel, Jerusalem Post, Ynet News, N12 (Mako), Walla News, Haaretz, PressTV (Iran), The National (UAE/GCC), Drop Site News, Breaking Defense, Long War Journal, Military Times, War on the Rocks, CENTCOM, U.S. DoD, and conflict-scoped Google News searches.
</details>

<details>
<summary><strong>Russia / Ukraine theater</strong></summary>

BBC Europe, New York Times Europe, Al Jazeera, Reuters World, Fox News World, Wall Street Journal, Kyiv Independent, Ukrainska Pravda (EN), Kyiv Post, The New Voice of Ukraine (NV), Ukrinform, TASS, RT, The Moscow Times, Meduza (EN), Breaking Defense, Military Times, War on the Rocks, U.S. DoD, and war-scoped Google News searches.
</details>

### Telegram Channels

Public channels only, scraped via Telegram's public embed endpoint. Channels are periodically activity-checked; the Russia/Ukraine set was last verified for recent activity in July 2026.

<details>
<summary><strong>Iran / Israel theater</strong></summary>

IDF Official, Rocket Alert, Alert Israel, Times of Israel, Abu Ali Express, OSINT Defender, Warfare Analysis, RN Intel, GeoPol Watch, ME Spectator (×2), Hamas-Israel War, PressTV, Iran International, Fars News, Tasnim News, Saberin (IRGC), DefaPress (Iran MOD), IRGC Official, Fotros Resistance, Quds News, Al-Saa EN, The Cradle, Drop Site News, France 24, WAM (UAE), Gulf News (UAE), Ali Bk, Al Jazeera, Bint Jbeil, Kian Meli (Iran).
</details>

<details>
<summary><strong>Russia / Ukraine theater</strong></summary>

**Ukrainian official / military:** UA General Staff, UA Air Force (kpszsu), Zelensky Official, Operatyvno ZSU, Ukraine NOW.

**Ukrainian outlets:** Kyiv Independent, Ukrainska Pravda, UNIAN, Suspilne, Trukha UA, NEXTA, Insider UA, LIGA-adjacent aggregators, BBC Ukraine, Radio Svoboda.

**Ukrainian journalists / independents:** Yuriy Butusov, Serhii Sternenko, Serhii Flash, Lachen, Anton Gerashchenko (EN), Tsaplienko, Motolko (Belarus).

**Russian state / war correspondents:** RIA Novosti, Russian MoD, Readovka, WarGonzo, RV Voenkor, Poddubny, Colonel Cassad, Grey Zone, Two Majors, Kots, Kotenok.

**Independent Russian journalists / outlets:** Meduza, Astra, Mediazona, Agentstvo, Holod, Maxim Katz.

**OSINT aggregators:** OSINT Defender, War Monitor, DeepState UA, Rybar.
</details>

### Polling Intervals

| Feed | Interval |
|------|----------|
| Air-raid alerts (Pikud HaOref / alerts.com.ua) | 15 seconds |
| Drone / missile tracker (Neptun) | 20 seconds |
| Telegram channels | 60 seconds |
| Regional threat monitor | 60 seconds |
| News RSS | 90 seconds |
| Strikes | 2 minutes |
| Conflicts / Flights | 3 minutes |
| Naval | 5 minutes |
| Markets, Oil, Crypto & Polymarket | 10 minutes |
| Fires (NASA FIRMS) | 10 minutes |

## Getting Started

**Prerequisite:** Node.js 22 (see [`.nvmrc`](.nvmrc); run `nvm use` if you use nvm). No API keys or environment variables required.

```bash
npm install   # or: npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the **THEATER** toggle in the header to switch conflicts.

To build for production:

```bash
npm run build
npm start
```

## Run with Docker

Prefer to run it isolated from your host (no local Node install, sandboxed dependencies and network)? A multi-stage `Dockerfile` produces a slim (~215 MB) standalone image that runs as a non-root user. No API keys or environment variables are needed.

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000). Stop with `Ctrl+C` (or `docker compose down`).

Or without Compose:

```bash
docker build -t ironsight .
docker run --rm -p 3000:3000 ironsight
```

To use a different host port, map it (e.g. `-p 8080:3000`) or edit the `ports` mapping in `docker-compose.yml`.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet / React-Leaflet
- **XML Parsing:** @xmldom/xmldom

## Architecture

Each conflict is a config object under `src/lib/conflicts/` describing everything theater-specific (map center/cities, keywords, RSS feeds, Telegram channels, alert provider, bounding boxes, etc.). A React context (`useConflict`) exposes the active conflict to the UI, and a `useConflictFeed` hook appends the selected conflict to every API request so the routes serve the right theater. Adding a new conflict is mostly a matter of adding a config file and registering it.

## Credits & Attribution

IRONSIGHT is a **viewer**, not a data owner. Every feed, dataset, headline, alert, track, tile, and post surfaced by this dashboard is the property of its respective provider and is used here, unmodified in substance, purely to point back to the original source. We claim **no ownership or credit** for any third-party data or open-source project listed below, and we are grateful to the people and communities who make them freely available:

- **News:** the news organizations and wire services listed above, via their public RSS feeds
- **Air-raid alerts:** [Pikud HaOref](https://www.oref.org.il/) via the community Tzeva Adom mirror; Ukrainian oblast alerts via [alerts.com.ua](https://alerts.com.ua/)
- **Drone / missile tracking:** [Neptun](https://neptun.in.ua/) (neptun.in.ua)
- **Aircraft:** [adsb.lol](https://www.adsb.lol) community ADS-B network
- **Satellite thermal:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)
- **Markets / energy:** Yahoo Finance; **crypto:** [CoinGecko](https://www.coingecko.com/); **prediction markets:** [Polymarket](https://polymarket.com/)
- **Maps:** [Leaflet](https://leafletjs.com/), basemap by [CARTO](https://carto.com/) with data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, borders from [Natural Earth](https://www.naturalearthdata.com/)
- **Translation:** Google Translate (unofficial endpoint)
- **Social OSINT:** public Telegram channels, owned by their respective operators

If you are a provider listed here and would like your source removed or its attribution changed, please [contact us](https://noblerworks.com/).

## Legal Disclaimer

### Purpose and Scope

This project is provided strictly for **educational and research purposes**. It demonstrates techniques for aggregating publicly available open-source intelligence (OSINT) using modern web technologies. It is not intended for commercial use, resale of data, or any activity that violates applicable laws or third-party terms of service.

### Data Sources

All data is sourced from publicly accessible endpoints. No paywalls are bypassed, no authentication is circumvented, and no copyrighted content is reproduced in full — only headlines, links, and publicly available metadata are displayed.

### Unofficial Endpoints

Some data sources rely on **unofficial or undocumented public endpoints**, including but not limited to: Yahoo Finance chart data, Google Translate, Telegram channel embeds, Google News RSS, and community alert/tracking feeds. These endpoints:

- Are not officially supported APIs and may violate the respective provider's Terms of Service
- May stop working, change, or be blocked without notice
- Are used here solely for non-commercial educational demonstration
- Should be replaced with official APIs if you intend to use this project commercially or in production

### Third-Party Content

News content, Telegram posts, financial data, alert data, drone/missile tracks, map tiles, and all other third-party content belong to their respective publishers, organizations, and data providers. This project does not claim ownership of, or credit for, any third-party content. Market data may be subject to additional redistribution restrictions from upstream data licensors.

### User Responsibility

By using this software, you agree that:

- **You are solely responsible** for ensuring your use complies with all applicable laws and third-party terms of service in your jurisdiction
- The authors and contributors of this project are **not liable** for any misuse, TOS violations, legal claims, or damages arising from use of this software
- You will **not use this software** for commercial data redistribution, automated trading, or any purpose that violates the terms of the underlying data providers
- This software is provided **"as is"** without warranty of any kind

### ADS-B Data Attribution

Military aircraft tracking data is provided by [adsb.lol](https://www.adsb.lol) under the [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/1-0/).

### Map Data Attribution

Basemap tiles © [CARTO](https://carto.com/attribution), map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Country boundary lines from [Natural Earth](https://www.naturalearthdata.com/) (public domain).

### No Endorsement

This project is not affiliated with, endorsed by, or sponsored by any of the data providers, news organizations, governments, or military entities whose data it aggregates.

## License

[MIT](LICENSE)
