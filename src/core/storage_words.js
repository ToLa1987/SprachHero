// =========================================================
// storage_words.js – Robust CSV Loader (UTF‑8 + Excel‑safe)
// =========================================================

const BASE_URL = "https://tola1987.github.io/SprachHero/data";

function cacheKey(lang) {
  return `sprachhero_words_cache_${lang}`;
}

function editedWordsKey(lang) {
  return `sprachhero_words_${lang}`;
}

// Robuster CSV‑Parser (Semikolon, Unicode‑Semikolon, Quotes)
function parseCsvLine(line) {
  const result = [];
  let cell = "";
  let insideQuotes = false;

  // Unicode‑Semikolon (Excel-Ersatz) erkennen
  const SEMI = ";";
  const U_SEMI = ";"; // griechisches Fragezeichen, Excel-Ersatz

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (!insideQuotes && (c === SEMI || c === U_SEMI)) {
      result.push(cell.trim());
      cell = "";
      continue;
    }

    cell += c;
  }

  result.push(cell.trim());
  return result;
}

function mapCsvLineToWord(line) {
  const cols = parseCsvLine(line);

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

export async function loadWords(lang) {
  const key = cacheKey(lang);

  const edited = localStorage.getItem(editedWordsKey(lang));
  if (edited !== null) {
    try {
      const arr = JSON.parse(edited);
      if (Array.isArray(arr)) return arr;
    } catch {
      // Ungültige lokale Änderungen nicht als gültiges Wörterbuch verwenden.
    }
  }

  const cached = localStorage.getItem(key);
  let cachedWords = null;
  if (cached !== null) {
    try {
      const arr = JSON.parse(cached);
      if (Array.isArray(arr)) cachedWords = arr;
    } catch {
      // Beschädigte Cache-Daten beim nächsten erfolgreichen Abruf ersetzen.
    }
  }

  const url = `${BASE_URL}/sprachhero_${lang}.csv?v=${Date.now()}`;

  let text = "";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("GitHub offline");
    text = await res.text();
  } catch {
    try {
      const localUrl = new URL(`data/sprachhero_${lang}.csv`, document.baseURI);
      const res = await fetch(localUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Lokale CSV nicht verfügbar");
      text = await res.text();
    } catch {
      return cachedWords || [];
    }
  }

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l =>
      l.length > 0 &&
      !l.startsWith("#") &&
      !l.toLowerCase().startsWith("id;")
    );

  const words = lines.map(mapCsvLineToWord);

  localStorage.setItem(key, JSON.stringify(words));

  return words;
}
