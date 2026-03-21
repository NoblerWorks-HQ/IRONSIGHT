// Hebrew to English translations for Pikud HaOref alert terms
// The alert system uses a fixed vocabulary so a dictionary works perfectly

// Threat type translations
export const THREAT_TRANSLATIONS: Record<string, string> = {
  // Missile threats
  'ירי רקטות וטילים': 'Rocket and Missile Fire',
  'ירי רקטות': 'Rocket Fire',
  'ירי טילים': 'Missile Fire',
  'טיל בליסטי': 'Ballistic Missile',
  'טילים': 'Missiles',
  'רקטות': 'Rockets',

  // Drone/UAV threats
  'חדירת כלי טיס עוין': 'Hostile Aircraft Intrusion',
  'חדירת כטבם': 'UAV Intrusion',
  'כלי טיס עוין': 'Hostile Aircraft',
  'כטבם': 'UAV/Drone',
  'כטב"ם': 'UAV/Drone',

  // Ground threats
  'חדירת מחבלים': 'Terrorist Infiltration',
  'חדירה': 'Infiltration',

  // Other threats
  'רעידת אדמה': 'Earthquake',
  'צונמי': 'Tsunami',
  'חומרים מסוכנים': 'Hazardous Materials',
  'אירוע חומרים מסוכנים': 'Hazmat Incident',
  'אירוע רדיולוגי': 'Radiological Event',
  'התרעה': 'Alert',
  'התרעת צבע אדום': 'Red Alert Warning',
  'צבע אדום': 'Red Alert',

  // Instructions
  'היכנסו למרחב המוגן': 'Enter Protected Space',
  'היכנסו למבנה': 'Enter Building',
};

// Common Israeli city/area translations
export const CITY_TRANSLATIONS: Record<string, string> = {
  'תל אביב': 'Tel Aviv',
  'תל אביב - יפו': 'Tel Aviv - Jaffa',
  'ירושלים': 'Jerusalem',
  'חיפה': 'Haifa',
  'באר שבע': 'Beer Sheva',
  'אשדוד': 'Ashdod',
  'אשקלון': 'Ashkelon',
  'שדרות': 'Sderot',
  'נתיבות': 'Netivot',
  'אילת': 'Eilat',
  'עכו': 'Acre',
  'נהריה': 'Nahariya',
  'צפת': 'Safed',
  'טבריה': 'Tiberias',
  'קריית שמונה': 'Kiryat Shmona',
  'כרמיאל': 'Carmiel',
  'עפולה': 'Afula',
  'בית שאן': 'Beit She\'an',
  'מגידו': 'Megiddo',
  'חדרה': 'Hadera',
  'נתניה': 'Netanya',
  'הרצליה': 'Herzliya',
  'רמת גן': 'Ramat Gan',
  'פתח תקווה': 'Petah Tikva',
  'ראשון לציון': 'Rishon LeZion',
  'רחובות': 'Rehovot',
  'לוד': 'Lod',
  'רמלה': 'Ramla',
  'מודיעין': 'Modi\'in',
  'בת ים': 'Bat Yam',
  'חולון': 'Holon',
  'בני ברק': 'Bnei Brak',
  'גבעתיים': 'Givatayim',
  'כפר סבא': 'Kfar Saba',
  'רעננה': 'Ra\'anana',
  'הוד השרון': 'Hod HaSharon',
  'דימונה': 'Dimona',
  'ערד': 'Arad',
  'מצפה רמון': 'Mitzpe Ramon',
  'עין גדי': 'Ein Gedi',
  'קריית גת': 'Kiryat Gat',
  'אופקים': 'Ofakim',
  'יבנה': 'Yavne',
  'גדרה': 'Gedera',

  // Regional councils / areas
  'עוטף עזה': 'Gaza Envelope',
  'שער הנגב': 'Sha\'ar HaNegev',
  'אשכול': 'Eshkol',
  'חוף אשקלון': 'Hof Ashkelon',
  'שפלת יהודה': 'Judean Foothills',
  'לכיש': 'Lachish',
  'מרחב שלמה': 'Merhav Shlomo',
  'יואב': 'Yoav',
  'הגליל העליון': 'Upper Galilee',
  'הגליל התחתון': 'Lower Galilee',
  'מרום הגליל': 'Merom HaGalil',
  'מטה אשר': 'Mateh Asher',
  'גולן': 'Golan',
  'עמק יזרעאל': 'Jezreel Valley',
  'מגילות ים המלח': 'Dead Sea Scrolls',
  'ערבה תיכונה': 'Central Arava',
  'בקעת הירדן': 'Jordan Valley',
  'עמק המעיינות': 'Springs Valley',
  'מנשה': 'Menashe',
  'מרכז הגליל': 'Central Galilee',

  // Gush Dan area
  'גוש דן': 'Gush Dan',
  'שרון': 'Sharon',
  'השרון': 'HaSharon',

  // South
  'נגב': 'Negev',
  'הנגב': 'HaNegev',

  // North
  'גליל': 'Galilee',
  'כנרת': 'Kinneret',
  'עמק חפר': 'Hefer Valley',

  // Cities near borders
  'מטולה': 'Metula',
  'שלומי': 'Shlomi',
  'מעלות': 'Ma\'alot',
  'מעלות-תרשיחא': 'Ma\'alot-Tarshiha',
  'יראון': 'Yir\'on',
  'אביבים': 'Avivim',
  'דן': 'Dan',
  'סאסא': 'Sasa',
  'עין פורעה': 'Ein Porea',
  'עין הבשור': 'Ein HaBesor',

  // General
  'כל הארץ': 'Entire Country',
  'מרכז הארץ': 'Central Israel',
  'צפון הארץ': 'Northern Israel',
  'דרום הארץ': 'Southern Israel',
};

/**
 * Translate a Hebrew string to English using the lookup tables.
 * Falls back to the original string if no translation is found.
 */
export function translateHebrew(text: string): string {
  if (!text) return text;

  // Check for exact match in threat translations
  if (THREAT_TRANSLATIONS[text]) return THREAT_TRANSLATIONS[text];

  // Check for exact match in city translations
  if (CITY_TRANSLATIONS[text]) return CITY_TRANSLATIONS[text];

  // Try partial matching - replace known Hebrew terms within the string
  let translated = text;
  for (const [heb, eng] of Object.entries(THREAT_TRANSLATIONS)) {
    if (translated.includes(heb)) {
      translated = translated.replace(heb, eng);
    }
  }
  for (const [heb, eng] of Object.entries(CITY_TRANSLATIONS)) {
    if (translated.includes(heb)) {
      translated = translated.replace(heb, eng);
    }
  }

  return translated;
}

/**
 * Translate an array of Hebrew city names to English
 */
export function translateCities(cities: string[]): string[] {
  return cities.map(city => CITY_TRANSLATIONS[city.trim()] || translateHebrew(city.trim()));
}

/**
 * Detect if a string contains Hebrew characters
 */
export function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Translate free-form Hebrew text to English using Google Translate (free, no key)
 * Falls back to original text on failure
 */
export async function translateFreeText(text: string): Promise<string> {
  if (!text) return text;

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encoded}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'IronSight/1.0' },
    });

    if (!res.ok) return text;

    const data = await res.json();
    const translated = (data[0] as [string][]).map((part: [string]) => part[0]).join('');
    return translated || text;
  } catch {
    return text;
  }
}

/**
 * Batch translate multiple Hebrew strings
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    texts.map(t => translateFreeText(t))
  );
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : texts[i]
  );
}
