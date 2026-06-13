// =========================================================
// /src/core/utils.js – SprachHero V8.0
// CSV, Box-Labels, Random, UI-Helper
// =========================================================

import { 
    getUserTotalXp, 
    getLevel, 
    getStreak,
    getUserProgress,
    getGlobal,
    getCurrentUser
} from "./storage.js";

// =========================================================
// BOX LABELS
// =========================================================

export function boxLabel(box) {
  switch (box) {
    case 1: return "Neue Wörter / Fehler";
    case 2: return "Erste Wiederholung";
    case 3: return "Mittlere Sicherheit";
    case 4: return "Gute Sicherheit";
    case 5: return "Sehr sicher / selten abfragen";
    default: return "";
  }
}

// =========================================================
// CSV PARSER
// =========================================================

export function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else current += ch;
  }
  result.push(current);
  return result;
}

// =========================================================
// XP / LEVEL / STREAK UI
// =========================================================

export function updateXpDisplay() {
  const xpDisplay = document.getElementById("xpDisplay");
  const user = getCurrentUser();

  if (!user) {
    xpDisplay.textContent = "Kein Nutzer ausgewählt";
    return;
  }

  const progress = getUserProgress(user.id) || {};
  const xp = progress.totalXp || 0;
  const level = getLevel(xp);

  const streak = getStreak(user.id);
  const streakText = streak.current > 0 
    ? ` · Streak: ${streak.current} (Best: ${streak.best})`
    : "";

  xpDisplay.textContent = `${user.avatar || "🙂"} ${user.name} · XP: ${xp} · Level: ${level}${streakText}`;
}

// =========================================================
// DARK MODE
// =========================================================

export function applyDarkMode() {
  const g = getGlobal();
  if (g.darkMode) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

// =========================================================
// DIFFICULTY SCORE (für adaptives Lernen)
// =========================================================

export function computeDifficultyScore(state) {
    if (!state) return 0;

    const seen = state.timesSeen || 0;
    const wrong = state.timesWrong || 0;

    if (seen < 2) return 0;

    const errorRate = seen > 0 ? wrong / seen : 0;
    const slow = state.avgResponseTime > 2500 ? 1 : 0;
    const recent = Date.now() - (state.lastTrainedAt || 0) < 60000 ? 1 : 0;

    let score = 0;

    score += Math.round(errorRate * 6);
    score += slow * 2;
    if (wrong > 0 && recent) score += 2;

    return Math.min(score, 10);
}
