
/* =========================================================
   SprachHero – storage_words.js
   GitHub CSV = maßgebliche Datenquelle
   Lokaler Cache = Offline-Fallback
   UTF-8, Semikolon, Anführungszeichen und BOM unterstützt
   ========================================================= */

const BASE_URL =
  "https://tola1987.github.io/SprachHero/data";

const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "it", "la", "pt", "ru"
];

function cacheKey(lang) {
  return `sprachhero_words_cache_${lang}`;
}

/* =========================================================
   CSV PARSER
   Unterstützt:
   - Semikolon als Trennzeichen
   - Felder in Anführungszeichen
   - Semikolons innerhalb von Anführungszeichen
   - Zeilenumbrüche innerhalb von Anführungszeichen
   - UTF-8-BOM
   ========================================================= */

function parseCsv(text) {
  // UTF-8-BOM entfernen
  text = text.replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        // Doppelte Anführungszeichen innerhalb eines Feldes
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === ";") {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(cell.trim());

      if (row.some(value => value !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  // Letzte Zeile verarbeiten
  row.push(cell.trim());

  if (row.some(value => value !== "")) {
    rows.push(row);
  }

  return rows;
}

/* =========================================================
   CSV-ZEILE IN VOKABEL UMWANDELN
   ========================================================= */

function mapRowToWord(cols) {
  return {
    id: cols[0] || "",
    word: cols[1] || "",
    translation: cols[2] || "",
    example: cols[3] || "",
    class: cols[4] || "",
    unit: cols[5] || "",
    subcategory: cols[6] || ""
  };
}

/* =========================================================
   CSV VALIDIEREN
   Leere oder offensichtlich fehlerhafte Daten nicht cachen.
   ========================================================= */

function parseWords(text) {
  const rows = parseCsv(text);

  const dataRows = rows.filter(row => {
    if (!row.length) return false;

    const first = (row[0] || "").trim().toLowerCase();

    // Kommentare und Kopfzeile überspringen
    if (first.startsWith("#")) return false;
    if (first === "id") return false;

    return true;
  });

  if (dataRows.length === 0) {
    throw new Error("Die CSV enthält keine Vokabeln.");
  }

  const words = dataRows.map(mapRowToWord);

  // Mindestens ID und Vokabel müssen vorhanden sein.
  const validWords = words.filter(word =>
    word.id.trim() !== "" &&
    word.word.trim() !== ""
  );

  if (validWords.length === 0) {
    throw new Error(
      "Die CSV konnte nicht als Vokabelliste gelesen werden."
    );
  }

  return validWords;
}

/* =========================================================
   CACHE SICHER LESEN
   ========================================================= */

function readCachedWords(lang) {
  try {
    const raw = localStorage.getItem(cacheKey(lang));

    if (!raw) return [];

    const words = JSON.parse(raw);

    if (
      !Array.isArray(words) ||
      words.length === 0 ||
      !words.every(word =>
        word &&
        typeof word.id === "string" &&
        typeof word.word === "string"
      )
    ) {
      return [];
    }

    return words;
  } catch (error) {
    console.warn(
      `[SprachHero] Cache für ${lang} konnte nicht gelesen werden:`,
      error
    );

    return [];
  }
}

/* =========================================================
   CACHE AKTUALISIEREN
   ========================================================= */

function saveCachedWords(lang, words) {
  try {
    localStorage.setItem(
      cacheKey(lang),
      JSON.stringify(words)
    );
  } catch (error) {
    // Beispielsweise bei vollem Speicher:
    // Die geladenen Wörter können trotzdem verwendet werden.
    console.warn(
      `[SprachHero] Cache für ${lang} konnte nicht gespeichert werden:`,
      error
    );
  }
}

/* =========================================================
   GITHUB CSV LADEN
   ========================================================= */

async function fetchGitHubWords(lang) {
  const url =
    `${BASE_URL}/sprachhero_${lang}.csv?v=${Date.now()}`;

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `GitHub CSV nicht erreichbar: HTTP ${response.status}`
    );
  }

  const text = await response.text();
  const words = parseWords(text);

  console.info(
    `[SprachHero] ${lang}: ${words.length} Vokabeln von GitHub geladen.`
  );

  return words;
}

/* =========================================================
   LOKALE CSV ALS ZWEITER VERSUCH
   Nützlich für lokale Entwicklung.
   ========================================================= */

async function fetchLocalWords(lang) {
  const url = new URL(
    `data/sprachhero_${lang}.csv`,
    document.baseURI
  );

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Lokale CSV nicht erreichbar: HTTP ${response.status}`
    );
  }

  return parseWords(await response.text());
}

/* =========================================================
   ÖFFENTLICHE FUNKTION
   Reihenfolge:
   1. Aktuelle GitHub CSV
   2. Lokale CSV (Entwicklung)
   3. Cache als Offline-Fallback

   Alte manuell gespeicherte Vokabellisten werden bewusst
   NICHT mehr verwendet.
   ========================================================= */

export async function loadWords(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.error(
      `[SprachHero] Unbekannte Sprache: ${lang}`
    );
    return [];
  }

  // 1. GitHub hat immer Vorrang.
  try {
    const words = await fetchGitHubWords(lang);

    saveCachedWords(lang, words);

    return words;
  } catch (githubError) {
    console.warn(
      `[SprachHero] GitHub für ${lang} nicht verfügbar:`,
      githubError
    );
  }

  // 2. Lokale CSV versuchen.
  try {
    const words = await fetchLocalWords(lang);

    saveCachedWords(lang, words);

    return words;
  } catch (localError) {
    console.warn(
      `[SprachHero] Lokale CSV für ${lang} nicht verfügbar:`,
      localError
    );
  }

  // 3. Nur offline auf den Cache zurückgreifen.
  const cachedWords = readCachedWords(lang);

  if (cachedWords.length > 0) {
    console.warn(
      `[SprachHero] ${lang}: ${cachedWords.length} Vokabeln aus dem Offline-Cache geladen.`
    );

    return cachedWords;
  }

  console.error(
    `[SprachHero] Für ${lang} sind keine Vokabeln verfügbar.`
  );

  return [];
}
