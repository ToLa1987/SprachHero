// =========================================================
// storage_words.js – Robust CSV Loader (UTF‑8 + Excel‑safe)
// =========================================================

const BASE_URL = "https://tola1987.github.io/SprachHero/data";

function cacheKey(lang) {
  return `sprachhero_words_cache_${lang}`;
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
  const hashKey = `sprachhero_words_hash_${lang}`;

  const cached = localStorage.getItem(key);
  const cachedHash = localStorage.getItem(hashKey);

  const url = `${BASE_URL}/sprachhero_${lang}.csv?v=${Date.now()}`;

  let text = "";
  let newHash = "";

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("GitHub offline");

    text = await res.text();
    newHash = hashText(text);

    // Wenn Datei leer → NICHT speichern
    if (text.trim().length < 10) throw new Error("Empty CSV");
  } catch {
    // Fallback: Nur wenn Cache existiert
    return cached ? JSON.parse(cached) : [];
  }

  // Wenn Hash identisch → Cache verwenden
  if (cached && cachedHash === newHash) {
    try {
      const arr = JSON.parse(cached);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }

  // CSV neu parsen
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l =>
      l.length > 0 &&
      !l.startsWith("#") &&
      !l.toLowerCase().startsWith("id;")
    );

  const words = lines.map(mapCsvLineToWord);

  // Cache + Hash speichern
  localStorage.setItem(key, JSON.stringify(words));
  localStorage.setItem(hashKey, newHash);

  return words;
}
