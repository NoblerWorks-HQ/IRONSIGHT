# IRONSIGHT

Real-time OSINT command center for geopolitical and defense intelligence monitoring.

## Features

- **Live Alert Monitoring** — Real-time Israeli air raid alerts (Pikud HaOref) with Hebrew auto-translation
- **Conflict Map** — Interactive Leaflet map with conflict events, military flights, and fire detections
- **Telegram OSINT** — Live feed from 20+ public intelligence channels (IDF, OSINT Defender, Iran Intl, etc.)
- **News Aggregation** — Multi-source RSS from BBC, Reuters, NYT, Al Jazeera, Israeli media, and defense blogs
- **Strike Tracking** — Aggregated missile, airstrike, and military operation reports
- **Military Aviation** — Real-time ADS-B tracking of military aircraft (ISR drones, SIGINT, AWACS, tankers)
- **Naval Tracking** — OSINT-compiled positions of carrier strike groups, task forces, and regional navies
- **Defense Markets** — Live defense stock tickers (LMT, RTX, NOC, BA, GD, LHX) and indices
- **Energy Markets** — Oil, natural gas, and commodity prices
- **Satellite Fire Detection** — NASA FIRMS thermal anomaly data with explosion flagging
- **Seismic Monitoring** — USGS earthquake data
- **Regional Alerts** — Per-country threat level monitoring across 10 Middle Eastern nations
- **Humanitarian Reports** — UN OCHA ReliefWeb data

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet / React-Leaflet
- **Data:** All public APIs, no keys required

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Sources

All data comes from free, public APIs and open-source feeds. No API keys or accounts are required.

| Source | Data |
|--------|------|
| Pikud HaOref (Tzeva Adom) | Israeli air raid alerts |
| NASA FIRMS | Satellite fire/thermal detection |
| USGS | Earthquake data |
| ReliefWeb (UN OCHA) | Humanitarian reports |
| adsb.lol | Military aircraft ADS-B |
| Yahoo Finance | Defense stocks, commodities |
| EIA | Gas prices (DEMO_KEY) |
| Google News RSS | Conflict news by region |
| GDELT Project | Global event data |
| Telegram (public channels) | OSINT intelligence feeds |
| BBC, Reuters, NYT, Al Jazeera | News RSS feeds |

> **Note:** Some endpoints (Yahoo Finance, Google Translate) are unofficial/undocumented. They are free and widely used but could change without notice.

## License

[MIT](LICENSE)
