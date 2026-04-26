[![Nobler Works](https://raw.githubusercontent.com/Noblerworks/IRONSIGHT/main/nobler-works-banner.JPG)](https://noblerworks.com/)

### Built by [Nobler Works](https://noblerworks.com/)

We build OSINT tools, real-time dashboards, and custom software for clients who need to move fast and see clearly. If you want something like IRONSIGHT built for your domain, [get in touch](https://noblerworks.com/).

**Follow us:** [Website](https://noblerworks.com/) · [X / Twitter](https://x.com/Nobler_Works) · [YouTube](https://www.youtube.com/@NoblerWorks) · [TikTok](https://www.tiktok.com/@noblerworks) · [Threads](https://www.threads.com/@noblerworks)

---

# IRONSIGHT

![IRONSIGHT Dashboard](https://raw.githubusercontent.com/Noblerworks/IRONSIGHT/main/Ironsight.png?v=2)

Real-time OSINT command center for monitoring the Middle East conflict. Aggregates open-source intelligence from 50+ sources across news, Telegram, military tracking, financial markets, and more into a single dashboard.

Built with Next.js, TypeScript, Tailwind CSS, and Leaflet. No API keys required. Completely free to run.

## Features

- **Live Intel Feed** — 20+ RSS news sources with keyword relevance filtering
- **Telegram OSINT** — 27 channels scraped in real-time with auto-translation (Hebrew/Arabic/Farsi), including GCC sources
- **Theater Map** — Interactive Leaflet map with military aircraft, naval vessels, strike markers from news and Telegram, missile trajectory arcs, range rings, and distance measurement
- **Israel Alert Status** — Live Pikud HaOref / Tzeva Adom missile alerts with audio notifications and looping missile trajectory arcs on the map
- **Conflict Monitor** — Categorized events (strikes, defense, diplomatic, nuclear)
- **Missile / Strike Tracker** — Weapon type classification and severity
- **Regional Threat Monitor** — Per-country threat levels across 10 nations
- **Military Airspace** — Live military aircraft tracking via adsb.lol
- **Naval Tracker** — Vessel monitoring in the Persian Gulf and Eastern Mediterranean
- **Defense & Markets** — Defense contractor stocks, indices, VIX, gold, USD via Yahoo Finance
- **Crypto Markets** — Bitcoin, Ethereum, Solana, BNB with 24h price changes
- **Prediction Markets** — Live Polymarket odds on Middle East conflict outcomes
- **Energy Markets** — WTI, Brent, natural gas, heating oil, gasoline via Yahoo Finance
- **Satellite Thermal Detect** — NASA FIRMS fire/explosion detection

## Data Sources

All data sources are free and require no API keys.

### News RSS Feeds

| Source | Region | Feed |
|--------|--------|------|
| BBC Middle East | International | `feeds.bbci.co.uk` |
| New York Times ME | US | `rss.nytimes.com` |
| Al Jazeera | Qatar/GCC | `aljazeera.com` |
| Reuters World | International | `feeds.reuters.com` |
| CNN Middle East | US | `rss.cnn.com` |
| Fox News World | US | `moxie.foxnews.com` |
| Wall Street Journal | US | `feeds.content.dowjones.io` |
| Times of Israel | Israel | `timesofisrael.com` |
| Jerusalem Post | Israel | `jpost.com` |
| Ynet News | Israel | `ynetnews.com` |
| N12 (Mako) | Israel | `rcs.mako.co.il` |
| Walla News | Israel | `rss.walla.co.il` |
| Haaretz | Israel | `haaretz.com` |
| PressTV | Iran | `presstv.ir` |
| The National | UAE/GCC | `thenationalnews.com` |
| Drop Site News | Independent | `dropsitenews.com` |
| Google News | Aggregator | `news.google.com` (3 conflict-specific searches) |
| Breaking Defense | US Defense | `breakingdefense.com` |
| Long War Journal | US Defense | `longwarjournal.org` |
| Military Times | US Defense | `militarytimes.com` |
| War on the Rocks | US Defense/Analysis | `warontherocks.com` |
| CENTCOM | US Military | `centcom.mil` |
| DoD | US Military | `defense.gov` |

### Telegram Channels

| Channel | Perspective |
|---------|------------|
| @IDFofficial | IDF Official |
| @RocketAlert | Israeli Rocket Alerts |
| @Alertisrael | Alert Israel |
| @TimesofIsrael | Times of Israel |
| @AbuAliExpress | Abu Ali Express (Israeli OSINT) |
| @OSINTdefender | OSINT Defender |
| @warfareanalysis | Warfare Analysis |
| @rnintel | RN Intel |
| @GeoPWatch | GeoPol Watch |
| @middle_east_spectator | ME Spectator |
| @Middle_East_Spectator | ME Spectator 2 |
| @HAMASW | Hamas-Israel War Updates |
| @PressTV | PressTV (Iran) |
| @iranintl_en | Iran International |
| @FarsNews_EN | Fars News (Iran) |
| @TasnimNewsEN | Tasnim News (Iran) |
| @SaberinFa | Saberin (IRGC-affiliated) |
| @defapress_ir | DefaPress (Iran MOD) |
| @sepah | IRGC Official |
| @FotrosResistancee | Fotros Resistance |
| @QudsNen | Quds News |
| @Alsaa_plus_EN | Al-Saa EN |
| @thecradlemedia | The Cradle |
| @dropsitenews | Drop Site News |
| @france24_en | France 24 |
| @wamnews_en | WAM - Emirates News Agency (UAE) |
| @gulfnewsUAE | Gulf News (UAE/GCC) |

### APIs

| Service | Data | Provider | Cost |
|---------|------|----------|------|
| Yahoo Finance | Stock prices, indices, commodities, oil futures | Yahoo | Free, no key |
| Tzeva Adom | Israeli missile/rocket alerts | Community mirror of Pikud HaOref | Free, no key |
| NASA FIRMS | Fire/thermal detection satellite data | NASA | Free, no key |
| adsb.lol | Military aircraft ADS-B tracking | Community ADS-B network | Free, no key |
| GDELT | Global event data | GDELT Project | Free, no key |
| CoinGecko | Cryptocurrency prices (BTC, ETH, SOL, BNB) | CoinGecko | Free, no key |
| Polymarket | Prediction market odds (Middle East conflict) | Polymarket | Free, no key |
| Google Translate | Hebrew/Arabic/Farsi auto-translation | Google (unofficial) | Free, no key |

### Polling Intervals

| Feed | Interval |
|------|----------|
| Israeli Alerts (Pikud HaOref) | 5 seconds |
| Telegram Channels | 60 seconds |
| News RSS | 90 seconds |
| Strikes | 2 minutes |
| Conflicts | 3 minutes |
| Markets, Oil, Crypto & Polymarket | 5 minutes |
| Fires (NASA FIRMS) | 10 minutes |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet / React-Leaflet
- **XML Parsing:** @xmldom/xmldom

## Legal Disclaimer

### Purpose and Scope

This project is provided strictly for **educational and research purposes**. It demonstrates techniques for aggregating publicly available open-source intelligence (OSINT) using modern web technologies. It is not intended for commercial use, resale of data, or any activity that violates applicable laws or third-party terms of service.

### Data Sources

All data is sourced from publicly accessible endpoints. No paywalls are bypassed, no authentication is circumvented, and no copyrighted content is reproduced in full -- only headlines, links, and publicly available metadata are displayed.

### Unofficial Endpoints

Some data sources rely on **unofficial or undocumented public endpoints**, including but not limited to: Yahoo Finance chart data, Google Translate, Telegram channel embeds, and Google News RSS feeds. These endpoints:

- Are not officially supported APIs and may violate the respective provider's Terms of Service
- May stop working, change, or be blocked without notice
- Are used here solely for non-commercial educational demonstration
- Should be replaced with official APIs if you intend to use this project commercially or in production

### Third-Party Content

News content, Telegram posts, financial data, alert data, and all other third-party content belong to their respective publishers, organizations, and data providers. This project does not claim ownership of any third-party content. Market data may be subject to additional redistribution restrictions from upstream data licensors.

### User Responsibility

By using this software, you agree that:

- **You are solely responsible** for ensuring your use complies with all applicable laws and third-party terms of service in your jurisdiction
- The authors and contributors of this project are **not liable** for any misuse, TOS violations, legal claims, or damages arising from use of this software
- You will **not use this software** for commercial data redistribution, automated trading, or any purpose that violates the terms of the underlying data providers
- This software is provided **"as is"** without warranty of any kind

### ADS-B Data Attribution

Military aircraft tracking data is provided by [adsb.lol](https://www.adsb.lol) under the [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/1-0/).

### No Endorsement

This project is not affiliated with, endorsed by, or sponsored by any of the data providers, news organizations, governments, or military entities whose data it aggregates.

## License

[MIT](LICENSE)
