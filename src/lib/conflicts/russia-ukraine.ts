import type { ConflictConfig } from './types';

// Russia / Ukraine theater.
// Mirrors the structure of the Iran/Israel config with Eastern-Europe data.
// Alert feed uses the free alerts.com.ua oblast air-raid API (English names),
// so no translation layer is needed. Telegram/naval sets are curated OSINT
// starting points — edit freely.

export const russiaUkraine: ConflictConfig = {
  key: 'russia-ukraine',
  label: 'RUSSIA / UKRAINE',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [49.0, 33.0],
    mapZoom: 5,

    cities: [
      { name: 'Kyiv', lat: 50.4501, lon: 30.5234, country: 'Ukraine', capital: true },
      { name: 'Kharkiv', lat: 49.9935, lon: 36.2304, country: 'Ukraine', capital: false },
      { name: 'Odesa', lat: 46.4825, lon: 30.7233, country: 'Ukraine', capital: false },
      { name: 'Dnipro', lat: 48.4647, lon: 35.0462, country: 'Ukraine', capital: false },
      { name: 'Lviv', lat: 49.8397, lon: 24.0297, country: 'Ukraine', capital: false },
      { name: 'Zaporizhzhia', lat: 47.8388, lon: 35.1396, country: 'Ukraine', capital: false },
      { name: 'Mykolaiv', lat: 46.9750, lon: 31.9946, country: 'Ukraine', capital: false },
      { name: 'Kherson', lat: 46.6354, lon: 32.6169, country: 'Ukraine', capital: false },
      { name: 'Mariupol', lat: 47.0951, lon: 37.5413, country: 'Ukraine', capital: false },
      { name: 'Bakhmut', lat: 48.5957, lon: 37.9990, country: 'Ukraine', capital: false },
      { name: 'Donetsk', lat: 48.0159, lon: 37.8028, country: 'Ukraine', capital: false },
      { name: 'Sevastopol', lat: 44.6166, lon: 33.5254, country: 'Crimea', capital: false },
      { name: 'Simferopol', lat: 44.9521, lon: 34.1024, country: 'Crimea', capital: false },
      { name: 'Moscow', lat: 55.7558, lon: 37.6173, country: 'Russia', capital: true },
      { name: 'Belgorod', lat: 50.5977, lon: 36.5858, country: 'Russia', capital: false },
      { name: 'Kursk', lat: 51.7373, lon: 36.1874, country: 'Russia', capital: false },
      { name: 'Bryansk', lat: 53.2434, lon: 34.3639, country: 'Russia', capital: false },
      { name: 'Rostov-on-Don', lat: 47.2357, lon: 39.7015, country: 'Russia', capital: false },
      { name: 'Voronezh', lat: 51.6720, lon: 39.1843, country: 'Russia', capital: false },
      { name: 'Krasnodar', lat: 45.0355, lon: 38.9753, country: 'Russia', capital: false },
      { name: 'Minsk', lat: 53.9006, lon: 27.5590, country: 'Belarus', capital: true },
      { name: 'Chisinau', lat: 47.0105, lon: 28.8638, country: 'Moldova', capital: true },
      { name: 'Warsaw', lat: 52.2297, lon: 21.0122, country: 'Poland', capital: true },
      { name: 'Bucharest', lat: 44.4268, lon: 26.1025, country: 'Romania', capital: true },
    ],

    cityColors: { Ukraine: '#66ccff', Russia: '#ff6666', Crimea: '#ffaa44', default: '#999999' },

    launchSites: [
      { name: 'Engels-2 Air Base (Bombers)', lat: 51.48, lon: 46.19, range: 2500 },
      { name: 'Belgorod (Iskander)', lat: 50.60, lon: 36.59, range: 500 },
      { name: 'Sevastopol (Kalibr / Black Sea Fleet)', lat: 44.62, lon: 33.53, range: 1500 },
      { name: 'Bryansk (Iskander)', lat: 53.25, lon: 34.37, range: 500 },
      { name: 'Rostov-on-Don (Southern MD)', lat: 47.24, lon: 39.70, range: 500 },
    ],

    strikeLocations: {
      // Ukraine
      'kyiv': [50.45, 30.52], 'kharkiv': [49.99, 36.23], 'odesa': [46.48, 30.72], 'odessa': [46.48, 30.72],
      'dnipro': [48.46, 35.05], 'lviv': [49.84, 24.03], 'zaporizhzhia': [47.84, 35.14],
      'mykolaiv': [46.98, 31.99], 'kherson': [46.64, 32.62], 'mariupol': [47.10, 37.54],
      'bakhmut': [48.60, 38.00], 'avdiivka': [48.14, 37.75], 'kramatorsk': [48.72, 37.58],
      'sumy': [50.91, 34.80], 'chernihiv': [51.49, 31.29], 'donetsk': [48.02, 37.80],
      'luhansk': [48.57, 39.31], 'pokrovsk': [48.28, 37.18], 'enerhodar': [47.50, 34.66],
      'ukraine': [49.0, 32.0],
      // Russia
      'moscow': [55.76, 37.62], 'belgorod': [50.60, 36.59], 'kursk': [51.74, 36.19],
      'bryansk': [53.24, 34.36], 'rostov': [47.24, 39.70], 'voronezh': [51.67, 39.18],
      'krasnodar': [45.04, 38.98], 'engels': [51.48, 46.19], 'novorossiysk': [44.72, 37.79],
      'russia': [55.0, 40.0],
      // Crimea / occupied
      'crimea': [45.30, 34.40], 'sevastopol': [44.62, 33.53], 'simferopol': [44.95, 34.10],
      'kerch': [45.36, 36.47], 'dzhankoi': [45.71, 34.39],
      // Others
      'belarus': [53.90, 27.56], 'black sea': [44.0, 31.5], 'sea of azov': [46.3, 36.5],
      'transnistria': [46.84, 29.64], 'moldova': [47.01, 28.86],
    },

    strikeTargets: [
      // Ukraine targets
      ['kyiv', 'Kyiv'], ['kharkiv', 'Kharkiv'], ['odesa', 'Odesa'], ['odessa', 'Odesa'],
      ['dnipro', 'Dnipro'], ['lviv', 'Lviv'], ['zaporizhzhia', 'Zaporizhzhia'],
      ['mykolaiv', 'Mykolaiv'], ['kherson', 'Kherson'], ['mariupol', 'Mariupol'],
      ['bakhmut', 'Bakhmut'], ['avdiivka', 'Avdiivka'], ['kramatorsk', 'Kramatorsk'],
      ['sumy', 'Sumy'], ['chernihiv', 'Chernihiv'], ['pokrovsk', 'Pokrovsk'],
      ['enerhodar', 'Enerhodar (ZNPP)'], ['zaporizhzhia npp', 'Zaporizhzhia NPP'],
      // Russia targets
      ['moscow', 'Moscow'], ['belgorod', 'Belgorod'], ['kursk', 'Kursk'], ['bryansk', 'Bryansk'],
      ['rostov', 'Rostov-on-Don'], ['voronezh', 'Voronezh'], ['engels', 'Engels Air Base'],
      ['novorossiysk', 'Novorossiysk'],
      // Crimea / occupied
      ['sevastopol', 'Sevastopol'], ['simferopol', 'Simferopol'], ['kerch', 'Kerch Bridge'],
      ['dzhankoi', 'Dzhankoi'], ['crimea', 'Crimea'],
      // Others
      ['black sea', 'Black Sea'], ['sea of azov', 'Sea of Azov'], ['belarus', 'Belarus'],
      ['transnistria', 'Transnistria'],
    ],

    // Keyed by lowercased alerts.com.ua name_en (oblast admin-center coordinates)
    alertCities: {
      'vinnytsia oblast': [49.23, 28.48], 'volyn oblast': [50.75, 25.34],
      'dnipropetrovsk oblast': [48.46, 35.05], 'donetsk oblast': [48.02, 37.80],
      'zhytomyr oblast': [50.25, 28.66], 'zakarpattia oblast': [48.62, 22.29],
      'zaporizhzhia oblast': [47.84, 35.14], 'ivano-frankivsk oblast': [48.92, 24.71],
      'kyiv oblast': [50.45, 30.52], 'kirovohrad oblast': [48.51, 32.26],
      'luhansk oblast': [48.57, 39.31], 'lviv oblast': [49.84, 24.03],
      'mykolaiv oblast': [46.98, 31.99], 'odesa oblast': [46.48, 30.73],
      'poltava oblast': [49.59, 34.55], 'rivne oblast': [50.62, 26.25],
      'sumy oblast': [50.91, 34.80], 'ternopil oblast': [49.55, 25.59],
      'kharkiv oblast': [49.99, 36.23], 'kherson oblast': [46.64, 32.61],
      'khmelnytskyi oblast': [49.42, 26.99], 'cherkasy oblast': [49.44, 32.06],
      'chernivtsi oblast': [48.29, 25.94], 'chernihiv oblast': [51.49, 31.29],
      'kyiv': [50.45, 30.52],
    },

    alertFallbackCenter: [49.0, 32.0],
    // Most strikes originate from Russian territory / the east
    defaultMissileOrigin: [50.60, 36.59],
    missileOrigins: [
      { match: 'crimea', coords: [44.95, 34.10] },
      { match: 'sevastopol', coords: [44.62, 33.53] },
      { match: 'black sea', coords: [44.0, 31.5] },
      { match: 'belarus', coords: [53.90, 27.56] },
      { match: 'engels', coords: [51.48, 46.19] },
    ],

    flightColors: [
      { match: 'US', color: '#00aaff' },
      { match: 'United States', color: '#00aaff' },
      { match: 'Ukraine', color: '#00d4ff' },
      { match: 'Russia', color: '#ff3366' },
      { match: 'UK', color: '#4488cc' },
      { match: 'Royal', color: '#4488cc' },
      { match: 'NATO', color: '#66aaff' },
    ],

    navyColors: {
      'US Navy': '#00aaff', 'Royal Navy': '#4488cc', 'Turkish Navy': '#00ff88',
      'Ukrainian Navy': '#00d4ff', 'Russian Navy': '#ff3366', 'NATO': '#66aaff',
    },

    timeZones: [
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
      { label: 'LON', zone: 'Europe/London', flag: '🇬🇧' },
      { label: 'KYIV', zone: 'Europe/Kyiv', flag: '🇺🇦' },
      { label: 'MSK', zone: 'Europe/Moscow', flag: '🇷🇺' },
      { label: 'WAW', zone: 'Europe/Warsaw', flag: '🇵🇱' },
      { label: 'BER', zone: 'Europe/Berlin', flag: '🇩🇪' },
    ],

    sourceColors: {
      'Reuters': '#ff8000', 'AP': '#ff2222', 'BBC': '#bb1919', 'NYT': '#333',
      'Al Jazeera': '#d4a843', 'CNN': '#cc0000', 'Fox News': '#003366', 'WSJ': '#0274b6',
      'Kyiv Independent': '#ffd500', 'Ukrainska Pravda': '#c00000', 'Kyiv Post': '#0057b7',
      'NV': '#1f6fb2', 'Ukrinform': '#2a7fff', 'TASS': '#c8102e', 'RT': '#00b140',
      'Moscow Times': '#0055a4', 'Meduza': '#333388', 'ISW': '#556b2f',
      'Breaking Def': '#cc0000', 'Mil Times': '#8b0000', 'War on Rocks': '#2e4057',
      'DoD': '#003366', 'Google News': '#4285f4',
    },

    navyOrder: ['US Navy', 'Royal Navy', 'Turkish Navy', 'Ukrainian Navy', 'NATO', 'Russian Navy'],
    maritimeRegions: ['Black Sea', 'Sea of Azov', 'Eastern Med', 'Kerch Strait'],

    countryColors: {
      'Russia': '#cc3355', 'Belarus': '#cc8833', 'Poland': '#4488cc', 'Moldova': '#e06030',
      'Romania': '#7744aa', 'Slovakia': '#44bbaa', 'Hungary': '#33aa77', 'Lithuania': '#8866cc',
      'Latvia': '#dd6699', 'Estonia': '#55aa55',
    },

    regionBoxes: [
      { name: 'Crimea', latMin: 44, latMax: 46.3, lonMin: 32.5, lonMax: 36.7 },
      { name: 'Moldova', latMin: 45.4, latMax: 48.5, lonMin: 26.6, lonMax: 30.2 },
      { name: 'Belarus', latMin: 51.2, latMax: 56.2, lonMin: 23, lonMax: 33 },
      { name: 'Poland', latMin: 49, latMax: 55, lonMin: 14, lonMax: 24 },
      { name: 'Romania', latMin: 43.6, latMax: 48.3, lonMin: 20.2, lonMax: 29.7 },
      { name: 'Russia', latMin: 43, latMax: 62, lonMin: 37, lonMax: 60 },
      { name: 'Ukraine', latMin: 44, latMax: 52.4, lonMin: 22, lonMax: 40.2 },
    ],
    defaultRegion: 'Eastern Europe',

    alertSystemName: 'Ukraine Air Alert',
    alertStatusTitle: 'UKRAINE ALERT STATUS',
    hasDroneTracker: true,
  },

  server: {
    strikeQueries: [
      'Russia+OR+Ukraine+missile+strike+OR+airstrike+OR+drone',
      'Ukraine+Shahed+OR+missile+OR+glide+bomb+OR+Russian+strike+OR+attack',
    ],
    countryAttribution: [
      { match: ['ukraine', 'kyiv', 'kharkiv', 'odesa', 'dnipro', 'kherson'], country: 'Ukraine' },
      { match: ['russia', 'moscow', 'belgorod', 'kursk', 'bryansk'], country: 'Russia' },
      { match: ['crimea', 'sevastopol'], country: 'Crimea' },
      { match: ['belarus'], country: 'Belarus' },
    ],
    defaultCountry: 'Eastern Europe',

    conflictQueries: [
      'Russia Ukraine war military conflict strike attack',
      'missile OR drone OR Shahed strike OR attack Kyiv OR Kharkiv OR Odesa OR Dnipro OR Zaporizhzhia OR Kherson OR Bakhmut OR Moscow OR Belgorod OR Kursk OR Crimea OR Sevastopol',
    ],
    conflictLocations: [
      { match: ['kyiv'], location: 'Kyiv, Ukraine' },
      { match: ['kharkiv'], location: 'Kharkiv, Ukraine' },
      { match: ['odesa', 'odessa'], location: 'Odesa, Ukraine' },
      { match: ['dnipro'], location: 'Dnipro, Ukraine' },
      { match: ['lviv'], location: 'Lviv, Ukraine' },
      { match: ['zaporizhzhia'], location: 'Zaporizhzhia, Ukraine' },
      { match: ['mykolaiv'], location: 'Mykolaiv, Ukraine' },
      { match: ['kherson'], location: 'Kherson, Ukraine' },
      { match: ['mariupol'], location: 'Mariupol, Ukraine' },
      { match: ['bakhmut'], location: 'Bakhmut, Ukraine' },
      { match: ['avdiivka'], location: 'Avdiivka, Ukraine' },
      { match: ['kramatorsk'], location: 'Kramatorsk, Ukraine' },
      { match: ['pokrovsk'], location: 'Pokrovsk, Ukraine' },
      { match: ['sumy'], location: 'Sumy, Ukraine' },
      { match: ['chernihiv'], location: 'Chernihiv, Ukraine' },
      { match: ['donetsk'], location: 'Donetsk, Ukraine' },
      { match: ['luhansk'], location: 'Luhansk, Ukraine' },
      { match: ['enerhodar', 'zaporizhzhia npp'], location: 'Zaporizhzhia NPP, Ukraine' },
      { match: ['moscow'], location: 'Moscow, Russia' },
      { match: ['belgorod'], location: 'Belgorod, Russia' },
      { match: ['kursk'], location: 'Kursk, Russia' },
      { match: ['bryansk'], location: 'Bryansk, Russia' },
      { match: ['rostov'], location: 'Rostov-on-Don, Russia' },
      { match: ['voronezh'], location: 'Voronezh, Russia' },
      { match: ['engels'], location: 'Engels, Russia' },
      { match: ['novorossiysk'], location: 'Novorossiysk, Russia' },
      { match: ['sevastopol'], location: 'Sevastopol, Crimea' },
      { match: ['simferopol'], location: 'Simferopol, Crimea' },
      { match: ['kerch'], location: 'Kerch, Crimea' },
      { match: ['crimea'], location: 'Crimea' },
      { match: ['belarus'], location: 'Belarus' },
      { match: ['black sea'], location: 'Black Sea' },
      { match: ['ukraine'], location: 'Ukraine' },
      { match: ['russia'], location: 'Russia' },
    ],

    countryQueries: [
      { country: 'Russia', flag: '🇷🇺', query: 'Russia+strike+OR+drone+OR+attack+OR+Belgorod+OR+Kursk+OR+Moscow+attack+OR+explosion' },
      { country: 'Belarus', flag: '🇧🇾', query: 'Belarus+military+OR+airspace+OR+troops+OR+Russia+OR+border+OR+drone' },
      { country: 'Poland', flag: '🇵🇱', query: 'Poland+airspace+OR+drone+OR+missile+OR+NATO+OR+border+OR+scramble+jets' },
      { country: 'Moldova', flag: '🇲🇩', query: 'Moldova+OR+Transnistria+drone+OR+missile+OR+airspace+OR+debris+OR+tension' },
      { country: 'Romania', flag: '🇷🇴', query: 'Romania+drone+OR+airspace+OR+missile+OR+NATO+OR+Danube+OR+debris' },
      { country: 'Slovakia', flag: '🇸🇰', query: 'Slovakia+Ukraine+OR+military+OR+NATO+OR+border+OR+airspace' },
      { country: 'Lithuania', flag: '🇱🇹', query: 'Lithuania+NATO+OR+Russia+OR+Belarus+OR+airspace+OR+Suwalki+OR+drone' },
      { country: 'Latvia', flag: '🇱🇻', query: 'Latvia+NATO+OR+Russia+OR+airspace+OR+border+OR+drone+OR+military' },
      { country: 'Estonia', flag: '🇪🇪', query: 'Estonia+NATO+OR+Russia+OR+airspace+OR+border+OR+drone+OR+military' },
      { country: 'Hungary', flag: '🇭🇺', query: 'Hungary+Ukraine+OR+NATO+OR+Russia+OR+border+OR+airspace' },
    ],

    polymarketKeywords: /ukraine|russia|russian|putin|zelensky|zelenskyy|kyiv|kremlin|donbas|donbass|crimea|kharkiv|bakhmut|wagner|belarus|moscow|nato.*(?:ukraine|russia)|ceasefire.*(?:ukraine|russia)|\bwar\b.*(?:ukraine|russia)|sanction.*russia|f-?16.*ukraine|himars|atacms|storm\s?shadow|drone.*(?:ukraine|russia)|missile.*(?:ukraine|russia)/i,
    polymarketExclude: /nba|nfl|mlb|nhl|fifa|world.?cup|premier.?league|champions.?league|super.?bowl|oscar|grammy|emmy|election.*governor|mayor|warriors|lakers|celtics|yankees|dodgers|iran|israel|gaza|hezbollah|hamas|houthi|china|taiwan|north.?korea|tariff|crypto|bitcoin|ethereum|solana/i,

    firesBBox: { latMin: 44, latMax: 56, lonMin: 22, lonMax: 48 },

    flightsCenter: { lat: 49, lon: 32, dist: 2500 },
    flightsBBox: { latMin: 44, latMax: 58, lonMin: 18, lonMax: 50 },

    newsFeeds: [
      // General wires + section feeds — keyword-filtered (they cover global news)
      { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', name: 'BBC' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml', name: 'NYT' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters' },
      // Ukrainian outlets — inherently on-topic, bypass the filter
      { url: 'https://kyivindependent.com/feed/', name: 'Kyiv Independent', unfiltered: true },
      { url: 'https://www.pravda.com.ua/eng/rss/', name: 'Ukrainska Pravda', unfiltered: true },
      { url: 'https://www.kyivpost.com/feed', name: 'Kyiv Post', unfiltered: true },
      { url: 'https://english.nv.ua/rss/all.xml', name: 'NV', unfiltered: true },
      { url: 'https://www.ukrinform.net/rss/block-lastnews', name: 'Ukrinform', unfiltered: true },
      // Russian/independent wires — general news, keyword-filtered
      { url: 'https://tass.com/rss/v2.xml', name: 'TASS' },
      { url: 'https://www.rt.com/rss/news/', name: 'RT' },
      { url: 'https://www.themoscowtimes.com/rss/news', name: 'Moscow Times' },
      { url: 'https://meduza.io/rss/en/all', name: 'Meduza' },
      // Google News searches are war-scoped queries — bypass the filter
      { url: 'https://news.google.com/rss/search?q=Russia+Ukraine+war+military&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Ukraine+missile+OR+drone+strike&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Ukraine+front+line+OR+offensive+Russia&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def' },
      { url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Mil Times' },
      { url: 'https://warontherocks.com/feed/', name: 'War on Rocks' },
      { url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', name: 'DoD' },
      { url: 'https://moxie.foxnews.com/google-publisher/world.xml', name: 'Fox News' },
      { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', name: 'WSJ' },
    ],
    // Require a Russia/Ukraine geography or actor term (plus UA-specific weapons)
    // so generic war words (missile/drone/strike/sanction) don't pull in Iran etc.
    newsRelevanceKeywords: /ukrain|russia|russian|putin|zelensky|kyiv|kharkiv|odesa|odessa|dnipro|zaporizhzhia|kherson|mykolaiv|mariupol|bakhmut|avdiivka|pokrovsk|kramatorsk|kupiansk|sumy|chernihiv|donbas|donetsk|luhansk|crimea|sevastopol|kremlin|moscow|belgorod|kursk|bryansk|belarus|wagner|himars|atacms|storm\s?shadow|shahed/i,

    telegramChannels: [
      { name: 'DeepStateUA', label: 'DeepState UA', color: '#ffd500' },
      { name: 'war_monitor', label: 'War Monitor', color: '#00aaff' },
      { name: 'OSINTdefender', label: 'OSINT Defender', color: '#00aaff' },
      { name: 'rybar', label: 'Rybar (RU)', color: '#cc3333' },
      { name: 'UkraineNow', label: 'Ukraine NOW', color: '#0057b7' },
      { name: 'GeneralStaffZSU', label: 'UA General Staff', color: '#005bbb' },
      { name: 'V_Zelenskiy_official', label: 'Zelensky Official', color: '#1f6fb2' },
      { name: 'mod_russia', label: 'Russian MoD (RU)', color: '#cc3333' },
      { name: 'nexta_live', label: 'NEXTA', color: '#ffd500' },
      { name: 'uniannet', label: 'UNIAN', color: '#1f6fb2' },
      { name: 'ukrpravda_news', label: 'Ukrainska Pravda', color: '#c00000' },
      { name: 'suspilnenews', label: 'Suspilne', color: '#6a1b9a' },
      { name: 'truexanewsua', label: 'Trukha UA', color: '#ff6600' },
      { name: 'ssternenko', label: 'Sternenko', color: '#33aa77' },
      { name: 'readovkanews', label: 'Readovka (RU)', color: '#884422' },
      { name: 'epoddubny', label: 'Poddubny (RU)', color: '#774433' },
      { name: 'boris_rozhin', label: 'Colonel Cassad (RU)', color: '#dd4444' },
      { name: 'wargonzo', label: 'WarGonzo (RU)', color: '#aa4444' },
      { name: 'rvvoenkor', label: 'RV Voenkor (RU)', color: '#cc5544' },
      { name: 'grey_zone', label: 'Grey Zone (RU)', color: '#888888' },
      { name: 'meduzalive', label: 'Meduza (RU)', color: '#333388' },
      { name: 'tsaplienko', label: 'Tsaplienko', color: '#2266bb' },
      { name: 'insiderUKR', label: 'Insider UA', color: '#44aacc' },
      { name: 'motolkohelp', label: 'Motolko (Belarus)', color: '#c4a535' },
      // --- Verified active (posted within 3 days, checked 2026-07-08) ---
      // Ukrainian official / journalists / outlets
      { name: 'kpszsu', label: 'UA Air Force', color: '#4fb0d8' },
      { name: 'pravdaGerashchenko_en', label: 'Gerashchenko', color: '#3a7bd5' },
      { name: 'KyivIndependent_official', label: 'Kyiv Independent TG', color: '#ffd500' },
      { name: 'butusovplus', label: 'Butusov', color: '#2e8bc0' },
      { name: 'lachentyt', label: 'Lachen', color: '#e0a800' },
      { name: 'serhii_flash', label: 'Serhii Flash', color: '#00a0a0' },
      { name: 'operativnoZSU', label: 'Operatyvno ZSU', color: '#005bbb' },
      { name: 'bbcukrainian', label: 'BBC Ukraine', color: '#bb1919' },
      { name: 'radiosvoboda', label: 'Radio Svoboda', color: '#2a7fff' },
      // Independent Russian journalists / outlets
      { name: 'astrapress', label: 'Astra (indep)', color: '#8e44ad' },
      { name: 'mediazzzona', label: 'Mediazona', color: '#b02a37' },
      { name: 'agentstvonews', label: 'Agentstvo', color: '#16a085' },
      { name: 'holodmedia', label: 'Holod', color: '#34495e' },
      { name: 'maximkatz', label: 'Maxim Katz', color: '#e67e22' },
      // Russian war correspondents / state
      { name: 'dva_majors', label: 'Two Majors (RU)', color: '#8b3a3a' },
      { name: 'sashakots', label: 'Kots (RU)', color: '#a0522d' },
      { name: 'voenkorKotenok', label: 'Kotenok (RU)', color: '#994444' },
      { name: 'rian_ru', label: 'RIA Novosti (RU)', color: '#c8102e' },
    ],

    ships: [
      { name: 'Admiral Makarov', hull: '799', type: 'Frigate', class: 'Admiral Grigorovich-class', navy: 'Russian Navy', lat: 44.60, lon: 37.80, status: 'Kalibr Carrier', region: 'Black Sea', group: 'Black Sea Fleet' },
      { name: 'Admiral Essen', hull: '751', type: 'Frigate', class: 'Admiral Grigorovich-class', navy: 'Russian Navy', lat: 43.40, lon: 36.90, status: 'Active', region: 'Black Sea', group: 'Black Sea Fleet' },
      { name: 'Rostov-on-Don', hull: 'B-237', type: 'Submarine', class: 'Kilo-class (Improved)', navy: 'Russian Navy', lat: 44.72, lon: 37.79, status: 'In Port (Novorossiysk)', region: 'Black Sea', group: 'Black Sea Fleet' },
      { name: 'Ivan Khurs', hull: '208', type: 'Intelligence Ship', class: 'Yuriy Ivanov-class', navy: 'Russian Navy', lat: 44.50, lon: 38.10, status: 'Active', region: 'Black Sea' },
      { name: 'Vyshny Volochek', hull: '609', type: 'Corvette', class: 'Buyan-M-class', navy: 'Russian Navy', lat: 44.10, lon: 37.40, status: 'Kalibr Carrier', region: 'Black Sea', group: 'Black Sea Fleet' },
      { name: 'Grayvoron', hull: '616', type: 'Corvette', class: 'Buyan-M-class', navy: 'Russian Navy', lat: 43.90, lon: 37.10, status: 'Active', region: 'Black Sea' },
      { name: 'Azov Flotilla', hull: 'Various', type: 'Fast Attack Craft', class: 'Various', navy: 'Russian Navy', lat: 46.30, lon: 36.60, status: 'Active', region: 'Sea of Azov', group: 'Azov Flotilla' },
      { name: 'Hetman Ivan Mazepa', hull: 'F211', type: 'Corvette', class: 'Ada-class', navy: 'Ukrainian Navy', lat: 46.45, lon: 30.75, status: 'Fitting Out', region: 'Black Sea', group: 'UA Navy' },
      { name: 'Magura V5 USVs', hull: 'USV', type: 'Naval Drone (USV)', class: 'Magura V5', navy: 'Ukrainian Navy', lat: 45.00, lon: 31.50, status: 'Active Ops', region: 'Black Sea', group: 'UA Navy' },
      { name: 'TCG Kinaliada', hull: 'F-514', type: 'Corvette', class: 'Ada-class', navy: 'Turkish Navy', lat: 41.20, lon: 29.10, status: 'Patrol (Bosphorus)', region: 'Black Sea' },
      { name: 'USS Arleigh Burke', hull: 'DDG-51', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 34.50, lon: 28.00, status: 'Deployed', region: 'Eastern Med', group: '6th Fleet' },
      { name: 'FS Auvergne', hull: 'D654', type: 'Frigate', class: 'FREMM-class', navy: 'NATO', lat: 35.20, lon: 26.50, status: 'Deployed', region: 'Eastern Med', group: 'NATO SNMG2' },
    ],
    shipRegions: ['Black Sea', 'Sea of Azov', 'Eastern Med', 'Kerch Strait'],

    alertProvider: 'alertsua',
    droneProvider: 'neptun',
  },
};
