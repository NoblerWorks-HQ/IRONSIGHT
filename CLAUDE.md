# IRONSIGHT

## Overview
Real-time OSINT command center for monitoring active conflicts - two theaters, Iran/Israel (Middle East) and Russia/Ukraine (`src/lib/conflicts/`). Aggregates open-source intelligence from 50+ sources across news, Telegram, military tracking, financial markets, and more into a single dashboard.

## Environment
- **Status**: Open Source / Development
- **Live URL**: Local only (no hosted version; `npm run dev` or `docker compose up --build`)
- **Cloud**: None

## Tech Stack
- Next.js + TypeScript + Tailwind CSS; maps: Leaflet
- Data: RSS feeds, Telegram scraping, Yahoo Finance, NASA FIRMS
- No database and no separate backend - upstream calls are proxied by Next API routes (`src/app/api/*/route.ts`)

## Common Commands
```bash
npm install
npm run dev      # development
npm run build    # build
npm start        # start production
```

## Project Structure
```
src/
├── app/           # Next.js app router; api/ = one route per upstream feed
├── components/    # React components (map/, panels/)
├── lib/           # data fetching utilities; conflicts/ = one config per theater
├── data/          # static data (city-data.json)
└── types/
```

## Notes
- No API keys required - all free data sources
- Open source under MIT license
- Features, data sources and polling intervals: `README.md`

## Docs stay current
- Update README, `docs/`, this CLAUDE.md and TODO.md **in the same commit** as the change that makes them wrong, never in a later cleanup. A stale doc is a bug.
