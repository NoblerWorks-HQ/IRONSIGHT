import type { ConflictConfig } from './types';

// Iran / Israel theater — the original IRONSIGHT configuration.
// Every value here is lifted verbatim from the pre-toggle hardcoded code so the
// default dashboard renders identically.

export const iranIsrael: ConflictConfig = {
  key: 'iran-israel',
  label: 'IRAN / ISRAEL',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [30.0, 48.0],
    mapZoom: 5,

    cities: [
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
    ],

    cityColors: { Iran: '#ff6666', Israel: '#66ccff', default: '#999999' },

    launchSites: [
      { name: 'Tabriz IRGC Base', lat: 38.08, lon: 46.29, range: 2000 },
      { name: 'Isfahan Missile Base', lat: 32.65, lon: 51.67, range: 2000 },
      { name: 'Shiraz Air Base', lat: 29.54, lon: 52.59, range: 1800 },
      { name: 'Khorramabad Base', lat: 33.49, lon: 48.35, range: 2000 },
    ],

    strikeLocations: {
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
    },

    strikeTargets: [
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
    ],

    alertCities: {
      'tel aviv': [32.085, 34.782], 'haifa': [32.794, 34.990], 'jerusalem': [31.768, 35.214],
      'beer sheva': [31.252, 34.791], 'ashkelon': [31.669, 34.574], 'ashdod': [31.804, 34.655],
      'sderot': [31.525, 34.596], 'eilat': [29.558, 34.952], 'tiberias': [32.796, 35.530],
      'nahariya': [33.010, 35.098], 'dimona': [31.070, 35.030], 'arad': [31.261, 35.213],
    },

    alertFallbackCenter: [31.5, 34.8],
    defaultMissileOrigin: [33.5, 48.0],
    missileOrigins: [
      { match: 'lebanon', coords: [33.89, 35.50] },
      { match: 'hezbollah', coords: [33.89, 35.50] },
    ],

    flightColors: [
      { match: 'US', color: '#00aaff' },
      { match: 'United States', color: '#00aaff' },
      { match: 'Israel', color: '#00d4ff' },
      { match: 'Iran', color: '#ff3366' },
      { match: 'UK', color: '#4488cc' },
      { match: 'Royal', color: '#4488cc' },
    ],

    navyColors: {
      'US Navy': '#00aaff', 'Royal Navy': '#4488cc', 'French Navy': '#6666cc',
      'Israeli Navy': '#00d4ff', 'Iran Navy': '#ff3366', 'IRGC Navy': '#ff3366', 'Saudi Navy': '#00ff88',
    },

    timeZones: [
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
      { label: 'LON', zone: 'Europe/London', flag: '🇬🇧' },
      { label: 'TLV', zone: 'Asia/Jerusalem', flag: '🇮🇱' },
      { label: 'THR', zone: 'Asia/Tehran', flag: '🇮🇷' },
      { label: 'RYD', zone: 'Asia/Riyadh', flag: '🇸🇦' },
      { label: 'MSK', zone: 'Asia/Shanghai', flag: '🇨🇳' },
    ],

    sourceColors: {
      'Reuters': '#ff8000', 'AP': '#ff2222', 'BBC': '#bb1919', 'NYT': '#333',
      'Al Jazeera': '#d4a843', 'Times of Israel': '#0066cc', 'JPost': '#003366',
      'CNN': '#cc0000', 'Fox News': '#003366', 'WSJ': '#0274b6', 'The National': '#1a6b3c',
      'PressTV': '#00a650', 'Breaking Def': '#cc0000', 'Long War Jrnl': '#556b2f',
      'Mil Times': '#8b0000', 'War on Rocks': '#2e4057', 'CENTCOM': '#4b5320',
      'DoD': '#003366', 'Haaretz': '#2a7fff', 'Drop Site': '#e63946', 'Ynet': '#f44336',
      'N12': '#e91e63', 'Walla': '#ff5722', 'Google News': '#4285f4',
    },

    navyOrder: ['US Navy', 'Royal Navy', 'French Navy', 'Israeli Navy', 'Saudi Navy', 'Iran Navy', 'IRGC Navy'],
    maritimeRegions: ['Persian Gulf', 'Red Sea', 'Eastern Med', 'Strait of Hormuz'],

    countryColors: {
      'Lebanon': '#e06030', 'Iran': '#cc3355', 'Iraq': '#cc8833', 'Syria': '#aa7744',
      'Yemen': '#55aa55', 'Kuwait': '#44bbaa', 'Bahrain': '#dd6699', 'UAE': '#8866cc',
      'Saudi Arabia': '#33aa77', 'Qatar': '#7744aa', 'Jordan': '#4488cc',
    },

    regionBoxes: [
      { name: 'Turkey', latMin: 36, latMax: 90, lonMin: 36, lonMax: 45 },
      { name: 'Israel', latMin: 29, latMax: 34, lonMin: 34, lonMax: 36 },
      { name: 'Iran', latMin: 24, latMax: 38, lonMin: 44, lonMax: 64 },
      { name: 'Iraq', latMin: 29, latMax: 38, lonMin: 38, lonMax: 49 },
      { name: 'Syria', latMin: 32, latMax: 38, lonMin: 35, lonMax: 43 },
      { name: 'Lebanon', latMin: 33, latMax: 35, lonMin: 35, lonMax: 37 },
      { name: 'Yemen', latMin: 12, latMax: 19, lonMin: 42, lonMax: 55 },
      { name: 'Saudi Arabia', latMin: 16, latMax: 33, lonMin: 34, lonMax: 56 },
      { name: 'UAE', latMin: 22, latMax: 27, lonMin: 51, lonMax: 57 },
      { name: 'Egypt', latMin: 25, latMax: 31, lonMin: 25, lonMax: 35 },
      { name: 'Jordan', latMin: 30, latMax: 34, lonMin: 35, lonMax: 40 },
      { name: 'Qatar/Bahrain', latMin: 23, latMax: 27, lonMin: 45, lonMax: 51 },
      { name: 'Oman', latMin: 21, latMax: 27, lonMin: 55, lonMax: 60 },
    ],
    defaultRegion: 'Middle East',

    alertSystemName: 'Pikud HaOref',
    alertStatusTitle: 'ISRAEL ALERT STATUS',
    hasDroneTracker: false,
  },

  server: {
    strikeQueries: [
      'Iran+OR+Israel+missile+strike+OR+airstrike+OR+intercept',
      'Iran+OR+Israel+drone+attack+OR+rocket+launch',
    ],
    countryAttribution: [
      { match: ['iran', 'tehran'], country: 'Iran' },
      { match: ['israel'], country: 'Israel' },
      { match: ['lebanon'], country: 'Lebanon' },
      { match: ['syria'], country: 'Syria' },
      { match: ['yemen', 'houthi'], country: 'Yemen' },
    ],
    defaultCountry: 'Middle East',

    conflictQueries: [
      'Iran Israel war military conflict strike attack',
      'missile OR rocket OR drone strike OR attack Arad OR Dimona OR "Tel Aviv" OR Haifa OR Eilat OR Tehran OR Isfahan OR Beirut OR "South Pars" OR Natanz OR "Diego Garcia"',
    ],
    conflictLocations: [
      { match: ['arad'], location: 'Arad, Israel' },
      { match: ['dimona', 'nuclear town'], location: 'Dimona, Israel' },
      { match: ['tel aviv'], location: 'Tel Aviv, Israel' },
      { match: ['haifa'], location: 'Haifa, Israel' },
      { match: ['eilat'], location: 'Eilat, Israel' },
      { match: ['ashkelon'], location: 'Ashkelon, Israel' },
      { match: ['ashdod'], location: 'Ashdod, Israel' },
      { match: ['negev'], location: 'Negev, Israel' },
      { match: ['natanz'], location: 'Natanz, Iran' },
      { match: ['isfahan'], location: 'Isfahan, Iran' },
      { match: ['tehran'], location: 'Tehran, Iran' },
      { match: ['south pars'], location: 'South Pars, Iran' },
      { match: ['bushehr'], location: 'Bushehr, Iran' },
      { match: ['tabriz'], location: 'Tabriz, Iran' },
      { match: ['beirut'], location: 'Beirut, Lebanon' },
      { match: ['lebanon'], location: 'Lebanon' },
      { match: ['damascus'], location: 'Damascus, Syria' },
      { match: ['syria'], location: 'Syria' },
      { match: ['baghdad'], location: 'Baghdad, Iraq' },
      { match: ['iraq'], location: 'Iraq' },
      { match: ['diego garcia'], location: 'Diego Garcia' },
      { match: ['qatar', 'doha'], location: 'Qatar' },
      { match: ['kuwait'], location: 'Kuwait' },
      { match: ['saudi'], location: 'Saudi Arabia' },
      { match: ['yemen', 'houthi'], location: 'Yemen' },
      { match: ['gaza'], location: 'Gaza' },
      { match: ['israel'], location: 'Israel' },
      { match: ['iran'], location: 'Iran' },
    ],

    countryQueries: [
      { country: 'Lebanon', flag: '🇱🇧', query: 'Lebanon+strike+OR+airstrike+OR+attack+OR+missile+OR+bomb+OR+Hezbollah+OR+Beirut+attack' },
      { country: 'Iran', flag: '🇮🇷', query: 'Iran+strike+OR+attack+OR+missile+OR+bomb+OR+Tehran+strike+OR+IRGC+attack' },
      { country: 'Iraq', flag: '🇮🇶', query: 'Iraq+strike+OR+attack+OR+missile+OR+Baghdad+strike+OR+militia+attack' },
      { country: 'Syria', flag: '🇸🇾', query: 'Syria+strike+OR+airstrike+OR+attack+OR+Damascus+strike' },
      { country: 'Yemen', flag: '🇾🇪', query: 'Yemen+Houthi+strike+OR+attack+OR+missile+OR+drone+OR+"Red+Sea"+attack' },
      { country: 'Kuwait', flag: '🇰🇼', query: 'Kuwait+siren+OR+missile+OR+attack+OR+"air+defense"+OR+intercept' },
      { country: 'Bahrain', flag: '🇧🇭', query: 'Bahrain+attack+OR+missile+OR+military+OR+threat+OR+"5th+Fleet"' },
      { country: 'UAE', flag: '🇦🇪', query: 'UAE+OR+Dubai+OR+"Abu+Dhabi"+attack+OR+missile+OR+drone+OR+intercept' },
      { country: 'Saudi Arabia', flag: '🇸🇦', query: 'Saudi+Arabia+attack+OR+missile+OR+drone+OR+intercept+OR+Houthi' },
      { country: 'Jordan', flag: '🇯🇴', query: 'Jordan+attack+OR+missile+OR+intercept+OR+airspace+OR+military' },
    ],

    polymarketKeywords: /\biran\b|israel|middle.?east|ceasefire|military.*iran|military.*israel|\bwar\b.*(?:iran|israel|middle.?east)|strike.*(?:iran|israel)|missile|nuclear.*iran|gaza|hezbollah|houthi|lebanon.*(?:strike|offensive|invasion)|syria.*strike|yemen.*(?:strike|attack)|hormuz|red.?sea.*(?:attack|military)|idf\b|irgc\b|netanyahu|khamenei|trump.*iran|regime.*(?:fall|change)|ground.*offensive|air.*strike|drone.*(?:iran|israel|attack)|ballistic/i,
    polymarketExclude: /nba|nfl|mlb|nhl|fifa|world.?cup|premier.?league|champions.?league|super.?bowl|oscar|grammy|emmy|election.*governor|mayor|warriors|lakers|celtics|yankees|dodgers|russia|ukraine|china|taiwan|north.?korea|tariff|crypto|bitcoin|ethereum|solana/i,

    firesBBox: { latMin: 20, latMax: 42, lonMin: 25, lonMax: 65 },

    flightsCenter: { lat: 30, lon: 48, dist: 2500 },
    flightsBBox: { latMin: 10, latMax: 45, lonMin: 20, lonMax: 70 },

    newsFeeds: [
      { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC', unfiltered: true },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', name: 'NYT', unfiltered: true },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters' },
      { url: 'https://www.timesofisrael.com/feed/', name: 'Times of Israel', unfiltered: true },
      { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', name: 'JPost', unfiltered: true },
      { url: 'https://www.ynetnews.com/Integration/StoryRss2.xml', name: 'Ynet', unfiltered: true },
      { url: 'https://rcs.mako.co.il/rss/news-military.xml', name: 'N12', unfiltered: true },
      { url: 'https://rss.walla.co.il/feed/22', name: 'Walla', unfiltered: true },
      { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'The National' },
      { url: 'http://rss.cnn.com/rss/edition_meast.rss', name: 'CNN' },
      { url: 'https://moxie.foxnews.com/google-publisher/world.xml', name: 'Fox News' },
      { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', name: 'WSJ' },
      { url: 'https://news.google.com/rss/search?q=Iran+Israel+war+military&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Iran+missile+strike+drone&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=%22Strait+of+Hormuz%22+OR+%22Red+Sea%22+military&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def' },
      { url: 'https://www.longwarjournal.org/feed', name: 'Long War Jrnl' },
      { url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Mil Times' },
      { url: 'https://warontherocks.com/feed/', name: 'War on Rocks' },
      { url: 'https://www.centcom.mil/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=808&max=20', name: 'CENTCOM', unfiltered: true },
      { url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', name: 'DoD', unfiltered: true },
      { url: 'https://www.haaretz.com/srv/haaretz-latest-headlines', name: 'Haaretz', unfiltered: true },
      { url: 'https://www.haaretz.com/srv/middle-east-news-rss', name: 'Haaretz', unfiltered: true },
      { url: 'https://www.dropsitenews.com/feed', name: 'Drop Site' },
      { url: 'https://www.presstv.ir/rss.xml', name: 'PressTV', unfiltered: true },
      { url: 'https://www.presstv.ir/rss/rss-102.xml', name: 'PressTV', unfiltered: true },
      { url: 'https://www.presstv.ir/rss/rss-101.xml', name: 'PressTV', unfiltered: true },
    ],
    newsRelevanceKeywords: /iran|israel|idf|irgc|hezbollah|hamas|houthi|lebanon|gaza|tehran|tel\s?aviv|jerusalem|yemen|iraq|syria|gulf|hormuz|red\s?sea|missile|strike|interception|nuclear|sanction|centcom|pentagon|middle\s?east|west\s?bank|golan|sinai|negev|dimona|natanz|isfahan|khamenei|netanyahu|nasrallah|raisi|ayatollah|mossad|shin\s?bet|quds|basij|proxy|ceasefire|escalat|retaliat|iron\s?dome|arrow|david.s\s?sling|patriot|drone|uav|saudi|emirates|uae|bahrain|qatar|kuwait|oman|gcc|opec/i,

    telegramChannels: [
      { name: 'IDFofficial', label: 'IDF Official', color: '#3388ff' },
      { name: 'RocketAlert', label: 'Rocket Alert', color: '#ff3366' },
      { name: 'PressTV', label: 'PressTV (Iran)', color: '#cc3333' },
      { name: 'OSINTdefender', label: 'OSINT Defender', color: '#00aaff' },
      { name: 'middle_east_spectator', label: 'ME Spectator', color: '#ff6600' },
      { name: 'iranintl_en', label: 'Iran Intl', color: '#00ff88' },
      { name: 'Alertisrael', label: 'Alert Israel', color: '#ff6688' },
      { name: 'QudsNen', label: 'Quds News', color: '#33cc66' },
      { name: 'TimesofIsrael', label: 'Times of Israel', color: '#0066cc' },
      { name: 'FarsNews_EN', label: 'Fars News', color: '#669933' },
      { name: 'FotrosResistancee', label: 'Fotros Resist.', color: '#dd4444' },
      { name: 'Alsaa_plus_EN', label: 'Al-Saa EN', color: '#ee8833' },
      { name: 'warfareanalysis', label: 'Warfare Analysis', color: '#8888cc' },
      { name: 'rnintel', label: 'RN Intel', color: '#44aacc' },
      { name: 'GeoPWatch', label: 'GeoPol Watch', color: '#cc66aa' },
      { name: 'thecradlemedia', label: 'The Cradle', color: '#aa8844' },
      { name: 'Middle_East_Spectator', label: 'ME Spectator 2', color: '#ff8844' },
      { name: 'HAMASW', label: 'Hamas-Israel War', color: '#339933' },
      { name: 'TasnimNewsEN', label: 'Tasnim News', color: '#557733' },
      { name: 'AbuAliExpress', label: 'Abu Ali Express', color: '#dd7733' },
      { name: 'dropsitenews', label: 'Drop Site News', color: '#e63946' },
      { name: 'france24_en', label: 'France 24', color: '#2266bb' },
      { name: 'SaberinFa', label: 'Saberin (IRGC)', color: '#884422' },
      { name: 'defapress_ir', label: 'DefaPress (Iran MOD)', color: '#556644' },
      { name: 'sepah', label: 'IRGC Official', color: '#774433' },
      { name: 'wamnews_en', label: 'WAM (UAE)', color: '#c4a535' },
      { name: 'gulfnewsUAE', label: 'Gulf News', color: '#e6b800' },
      { name: 'Alibk3', label: 'Ali Bk', color: '#44bb88' },
      { name: 'aljazeeraglobal', label: 'Al Jazeera', color: '#d4a843' },
      { name: 'bintjbeilnews', label: 'Bint Jbeil', color: '#55aa77' },
      { name: 'kianmeli1', label: 'Kian Meli (Iran)', color: '#7744aa' },
    ],

    ships: [
      { name: 'USS Bataan', hull: 'LHD-5', type: 'Amphibious Assault Ship', class: 'Wasp-class', navy: 'US Navy', lat: 26.1, lon: 50.5, status: 'Deployed', region: 'Persian Gulf', group: '5th Fleet' },
      { name: 'USS Mason', hull: 'DDG-87', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 14.5, lon: 42.8, status: 'Active', region: 'Red Sea', group: 'Red Sea Task Force' },
      { name: 'USS Carney', hull: 'DDG-64', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 13.8, lon: 43.2, status: 'Active', region: 'Red Sea', group: 'Red Sea Task Force' },
      { name: 'USS Laboon', hull: 'DDG-58', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 25.8, lon: 52.1, status: 'Deployed', region: 'Persian Gulf', group: '5th Fleet' },
      { name: 'USS Philippine Sea', hull: 'CG-58', type: 'Cruiser', class: 'Ticonderoga-class', navy: 'US Navy', lat: 25.2, lon: 56.8, status: 'Deployed', region: 'Strait of Hormuz', group: 'Carrier Strike Group' },
      { name: 'USS Florida', hull: 'SSGN-728', type: 'Guided Missile Submarine', class: 'Ohio-class', navy: 'US Navy', lat: 26.5, lon: 56.2, status: 'Deployed', region: 'Strait of Hormuz', group: 'CENTCOM' },
      { name: 'HMS Diamond', hull: 'D34', type: 'Destroyer', class: 'Type 45', navy: 'Royal Navy', lat: 14.2, lon: 42.5, status: 'Active', region: 'Red Sea', group: 'Op Prosperity Guardian' },
      { name: 'FS Alsace', hull: 'D656', type: 'Frigate', class: 'FREMM-class', navy: 'French Navy', lat: 34.5, lon: 33.2, status: 'Deployed', region: 'Eastern Med' },
      { name: 'INS Magen', hull: "Sa'ar 6", type: 'Corvette', class: "Sa'ar 6-class", navy: 'Israeli Navy', lat: 32.8, lon: 34.5, status: 'Patrol', region: 'Eastern Med' },
      { name: 'INS Dolphin', hull: 'Submarine', type: 'Submarine', class: 'Dolphin-class', navy: 'Israeli Navy', lat: 31.5, lon: 33.8, status: 'Patrol', region: 'Eastern Med' },
      { name: 'IRIS Makran', hull: 'Forward Base Ship', type: 'Forward Base Ship', class: 'Makran-class', navy: 'Iran Navy', lat: 25.4, lon: 57.5, status: 'Active', region: 'Strait of Hormuz' },
      { name: 'IRIS Sahand', hull: 'F-74', type: 'Frigate', class: 'Moudge-class', navy: 'Iran Navy', lat: 27.1, lon: 56.3, status: 'Active', region: 'Persian Gulf' },
      { name: 'IRGCN Fast Boats', hull: 'Various', type: 'Fast Attack Craft', class: 'Various', navy: 'IRGC Navy', lat: 26.8, lon: 56.1, status: 'Active', region: 'Strait of Hormuz', group: 'IRGCN Patrol' },
      { name: 'HMS Al Riyadh', hull: 'F-3000S', type: 'Frigate', class: 'Al Riyadh-class', navy: 'Saudi Navy', lat: 20.5, lon: 39.8, status: 'Patrol', region: 'Red Sea' },
    ],
    shipRegions: ['Persian Gulf', 'Red Sea', 'Eastern Med', 'Arabian Sea'],

    alertProvider: 'tzevaadom',
    // No free real-time drone-track source for this theater
  },
};
