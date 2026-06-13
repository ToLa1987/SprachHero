// =========================================================
// /src/core/storage.js – SprachHero V14 (bereinigt)
// Core: Users, Words, Progress, XP, Sessions, Badges, Boosts
// + LearningPath
// =========================================================

import { XP } from "./xp.js";

// NEU: Wörter aus GitHub/Cache laden
import { loadWords } from "./storage_words.js";

// ===== Storage keys =====

export const WORDS_KEYS = {
  en: "sprachhero_words_en",
  fr: "sprachhero_words_fr",
  la: "sprachhero_words_la",
  es: "sprachhero_words_es",
  it: "sprachhero_words_it"
};

const STORAGE_KEY_USERS = "sprachhero_users";
const STORAGE_KEY_CURRENT_USER = "sprachhero_current_user";
const STORAGE_KEY_PROGRESS = "sprachhero_progress_v7";
const STORAGE_KEY_GLOBAL = "sprachhero_global_v7";
const STORAGE_KEY_XP_HISTORY = "sprachhero_xp_history_v7";

// =========================================================
// GLOBAL SETTINGS
// =========================================================

export function getGlobal() {
  const raw = localStorage.getItem(STORAGE_KEY_GLOBAL);
  if (!raw) {
    return {
      darkMode: false,
      language: "en",
      dailyGoal: 30,
      weeklyGoal: 150,
      monthlyGoal: 600,
      enableMultipleChoice: false,
      adminPassword: "",
      streaks: {}
    };
  }

  try { return JSON.parse(raw); }
  catch {
    return {
      darkMode: false,
      language: "en",
      dailyGoal: 30,
      weeklyGoal: 150,
      monthlyGoal: 600,
      enableMultipleChoice: false,
      adminPassword: "",
      streaks: {}
    };
  }
}

export function setGlobal(obj) {
  localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(obj));
}

// =========================================================
// WORDS
// =========================================================

// NEU: Wörter über storage_words.js laden (GitHub → Cache → Offline)
export async function getWordsForLang(lang) {
  const words = await loadWords(lang);
  return Array.isArray(words) ? words : [];
}


// Hinweis: Wird nur noch vom Editor genutzt, nicht mehr produktiv.
// Produktive Daten kommen aus GitHub → storage_words.js
export function setWordsForLang(lang, words) {
  const key = WORDS_KEYS[lang] || WORDS_KEYS.en;
  localStorage.setItem(key, JSON.stringify(words));
}

// =========================================================
// USERS
// =========================================================

export function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

export function setUsers(users) {
  users = users.map(u => {
    if (!u.storyAchievements) u.storyAchievements = {};
    return u;
  });

  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

export function getCurrentUserId() {
  return localStorage.getItem(STORAGE_KEY_CURRENT_USER) || null;
}

export function setCurrentUserId(id) {
  if (!id) localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  else localStorage.setItem(STORAGE_KEY_CURRENT_USER, id);
}

export function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;

  const user = getUsers().find(u => u.id === id) || null;
  if (!user) return null;

  if (!user.storyAchievements) user.storyAchievements = {};

  return user;
}

// =========================================================
// PROGRESS RAW
// =========================================================

function getProgressRaw() {
  const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

function setProgressRaw(obj) {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(obj));
}

export function getUserProgress(userId) {
  const all = getProgressRaw();
  return all[userId] || {};
}

export function setUserProgress(userId, progress) {
  const all = getProgressRaw();
  all[userId] = progress;
  setProgressRaw(all);
}

// =========================================================
// WORD STATE
// =========================================================

export function getUserWordState(userId, lang, wordId) {
  const progress = getUserProgress(userId);
const key = `${lang}_${wordId}`;
  const state = progress[key] || {};

  return {
    box: state.box || 1,
    xp: state.xp || 0,
    correct: state.correct || 0,
    wrong: state.wrong || 0,

    ef: (typeof state.ef === "number") ? state.ef : 2.5,
    interval: (typeof state.interval === "number") ? state.interval : 0,
    repetitions: (typeof state.repetitions === "number") ? state.repetitions : 0,
    nextDue: (typeof state.nextDue === "number") ? state.nextDue : Date.now(),

    lastTrainedAt: state.lastTrainedAt || 0,
    timesSeen: state.timesSeen || 0,
    timesCorrect: state.timesCorrect || 0,
    timesWrong: state.timesWrong || 0,
    avgResponseTime: state.avgResponseTime || 0,
    flag: state.flag || null
  };
}

export function setUserWordState(userId, lang, wordId, state) {
  const progress = getUserProgress(userId);
const key = `${lang}_${wordId}`;
  progress[key] = state;
  setUserProgress(userId, progress);
}

// =========================================================
// TOTAL XP
// =========================================================

export function getUserTotalXp(userId) {
  const progress = getUserProgress(userId);
  return progress.totalXp || 0;
}

// =========================================================
// XP HISTORY
// =========================================================

export function getXpHistory() {
  const raw = localStorage.getItem(STORAGE_KEY_XP_HISTORY);
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

export function setXpHistory(obj) {
  localStorage.setItem(STORAGE_KEY_XP_HISTORY, JSON.stringify(obj));
}

export function addXpToHistory(userId, xpGain) {
  if (xpGain === 0) return;

  const history = getXpHistory();
  const today = new Date().toISOString().slice(0, 10);

  history[userId] = history[userId] || {};
  history[userId][today] = (history[userId][today] || 0) + xpGain;

  setXpHistory(history);
}

// =========================================================
// LEVEL / BOX / XP
// =========================================================

export function getLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

export function updateWordBoxState(state, isCorrect) {
  const currentBox = state.box || 1;
  if (isCorrect) state.box = Math.min(currentBox + 1, 5);
  else state.box = 1;
}

// =========================================================
// STREAK
// =========================================================

export function updateStreak(userId, isCorrect) {
  const g = getGlobal();
  g.streaks = g.streaks || {};

  const s = g.streaks[userId] || { current: 0, best: 0 };

  if (isCorrect) {
    s.current++;
    if (s.current > s.best) s.best = s.current;
  } else {
    s.current = 0;
  }

  g.streaks[userId] = s;
  setGlobal(g);
}

export function getStreak(userId) {
  const g = getGlobal();
  return (g.streaks || {})[userId] || { current: 0, best: 0 };
}

// =========================================================
// GLOBAL CORRECT/WRONG
// =========================================================

export function getGlobalCorrectWrong(userId, lang) {
  const progress = getUserProgress(userId);

  let correct = 0;
  let wrong = 0;

  const prefix = `${lang}_`;

  Object.entries(progress).forEach(([key, state]) => {
    if (!key.startsWith(prefix)) return;
    correct += state.correct || 0;
    wrong += state.wrong || 0;
  });

  return { correct, wrong };
}

// =========================================================
// SESSION SYSTEM
// =========================================================

export function getUserSession(userId) {
  const progress = getUserProgress(userId);

  if (!progress.session) {
    progress.session = {
      totalSeconds: 0,
      longestSession: 0,
      sessionsCompleted: 0,
      history: []
    };
    setUserProgress(userId, progress);
  }

  return progress.session;
}

export function setUserSession(userId, sessionObj) {
  const progress = getUserProgress(userId);
  progress.session = sessionObj;
  setUserProgress(userId, progress);
}

export function addCompletedSession(userId, sessionData) {
  if (!userId || !sessionData || !sessionData.seconds || sessionData.seconds <= 0) return;

  const progress = getUserProgress(userId);

  if (!progress.session) {
    progress.session = {
      totalSeconds: 0,
      longestSession: 0,
      sessionsCompleted: 0,
      history: []
    };
  }

  const session = progress.session;
  const today = new Date().toISOString().slice(0, 10);

  const seconds = sessionData.seconds || 0;
  const xp = sessionData.xp || 0;
  const words = sessionData.words || 0;
  const correct = sessionData.correct || 0;
  const wrong = sessionData.wrong || 0;

  session.totalSeconds += seconds;
  session.longestSession = Math.max(session.longestSession || 0, seconds);
  session.sessionsCompleted = (session.sessionsCompleted || 0) + 1;

  session.history = session.history || [];
  session.history.push({
    date: today,
    seconds,
    xp,
    words,
    correct,
    wrong
  });

  progress.session = session;
  setUserProgress(userId, progress);
}

// =========================================================
// BADGES / BOOSTS / LEARNING PATH
// =========================================================

function ensureProgress(userId) {
  const p = getUserProgress(userId);

  if (!p.dailyQuests) p.dailyQuests = {};
  if (!p.badges) p.badges = {};
  if (!p.activeBoost) p.activeBoost = null;
  if (!p.learningPath) p.learningPath = {};

  return p;
}

export function unlockBadge(userId, badgeId) {
  const p = ensureProgress(userId);
  if (p.badges[badgeId]) return;

  p.badges[badgeId] = true;
  setUserProgress(userId, p);

  window.dispatchEvent(new CustomEvent("badgeUnlocked", { detail: { badgeId } }));
}

export function hasBadge(userId, badgeId) {
  const p = ensureProgress(userId);
  return !!p.badges[badgeId];
}

export function activateBoost(userId, multiplier, durationSeconds) {
  const p = ensureProgress(userId);

  p.activeBoost = {
    multiplier,
    endsAt: Date.now() + durationSeconds * 1000
  };

  setUserProgress(userId, p);

  window.dispatchEvent(new CustomEvent("boostActivated", {
    detail: { multiplier, durationSeconds }
  }));
}

export function getActiveBoost(userId) {
  const p = getUserProgress(userId);
  const boost = p.activeBoost;

  if (!boost) return null;

  if (Date.now() > boost.endsAt) {
    p.activeBoost = null;
    setUserProgress(userId, p);
    return null;
  }

  return boost;
}

export function updateLearningPath(userId, stats) {
  const p = ensureProgress(userId);

  p.learningPath = {
    weakestBox: stats.weakestBox,
    weakestUnit: stats.weakestUnit,
    recommendedSession: stats.recommendedSession,
    updatedAt: Date.now()
  };

  setUserProgress(userId, p);
}

export function getLearningPath(userId) {
  const p = ensureProgress(userId);
  return p.learningPath;
}

// =========================================================
// QUEST ENGINE V1 – STORAGE
// Daily + Weekly + Dynamic Missions
// =========================================================

// ---------------------------------------------------------
// Core State
// ---------------------------------------------------------

export function getQuestState(userId) {
  const data = JSON.parse(localStorage.getItem("quests_" + userId) || "{}");
  return {
    daily: data.daily || [],
    weekly: data.weekly || [],
    lastDailyReset: data.lastDailyReset || 0,
    lastWeeklyReset: data.lastWeeklyReset || 0
  };
}

export function saveQuestState(userId, state) {
  localStorage.setItem("quests_" + userId, JSON.stringify(state));
}

// ---------------------------------------------------------
// RESET LOGIK
// ---------------------------------------------------------

export function resetDailyQuests(userId) {
  const state = getQuestState(userId);
  state.daily = generateDailyQuestSet(userId);
  state.lastDailyReset = Date.now();
  saveQuestState(userId, state);
  return state.daily;
}

export function resetWeeklyQuests(userId) {
  const state = getQuestState(userId);
  state.weekly = generateWeeklyQuestSet(userId);
  state.lastWeeklyReset = Date.now();
  saveQuestState(userId, state);
  return state.weekly;
}

// ---------------------------------------------------------
// DAILY QUEST GENERATOR – DYNAMISCH
// ---------------------------------------------------------

export function generateDailyQuestSet(userId) {
  const user = getCurrentUser();
  const quests = [];

  // 1) Box-Missionen
  quests.push({
    id: "box_promote",
    category: "Wiederholung",
    icon: "📦",
    text: "Bringe 10 Wörter in die nächste Box",
    type: "promote",
    target: 10,
    progress: 0,
    reward: 15,
    difficulty: "easy"
  });

  // 2) Audio-Mission
  quests.push({
    id: "audio_5",
    category: "Hören",
    icon: "🔊",
    text: "Höre 5 Wörter an",
    type: "audio",
    target: 5,
    progress: 0,
    reward: 10,
    difficulty: "easy"
  });

  // 3) Fehlerfrei-Mission
  quests.push({
    id: "perfect_10",
    category: "Fokus",
    icon: "🎯",
    text: "10 Wörter ohne Fehler",
    type: "perfect",
    target: 10,
    progress: 0,
    reward: 20,
    difficulty: "medium"
  });

  // 4) Lernpfad-Mission
  quests.push({
    id: "lp_1",
    category: "Lernpfad",
    icon: "🧭",
    text: "Schließe 1 Lernpfad-Kachel ab",
    type: "learningpath",
    target: 1,
    progress: 0,
    reward: 25,
    difficulty: "medium"
  });

  // 5) Gold-Mission (selten)
  if (Math.random() < 0.15) {
    quests.push({
      id: "gold_master",
      category: "Legendär",
      icon: "🏆",
      text: "Schließe 30 Wörter heute ab",
      type: "words",
      target: 30,
      progress: 0,
      reward: 50,
      difficulty: "hard",
      gold: true
    });
  }

  return quests;
}

// ---------------------------------------------------------
// WEEKLY QUESTS
// ---------------------------------------------------------

export function generateWeeklyQuestSet(userId) {
  return [
    {
      id: "weekly_sessions",
      category: "Ausdauer",
      icon: "🔥",
      text: "Absolviere 7 Lern-Sessions",
      type: "sessions",
      target: 7,
      progress: 0,
      reward: 100,
      difficulty: "medium"
    },
    {
      id: "weekly_words",
      category: "Wortschatz",
      icon: "📚",
      text: "Lerne 100 Wörter",
      type: "words",
      target: 100,
      progress: 0,
      reward: 150,
      difficulty: "hard"
    }
  ];
}

// ---------------------------------------------------------
// PROGRESS UPDATE
// ---------------------------------------------------------

export function updateQuestProgress(userId, type, amount = 1) {
  const state = getQuestState(userId);

  function update(list) {
    list.forEach(q => {
      if (q.type === type && !q.claimed) {
        q.progress = Math.min(q.target, q.progress + amount);
        if (q.progress >= q.target) q.done = true;
      }
    });
  }

  update(state.daily);
  update(state.weekly);

  saveQuestState(userId, state);
}

// ---------------------------------------------------------
// CLAIM
// ---------------------------------------------------------

export function claimQuestReward(userId, questId) {
  const state = getQuestState(userId);

  function claim(list) {
    const q = list.find(x => x.id === questId);
    if (q && q.done && !q.claimed) {
      q.claimed = true;
      return q.reward;
    }
    return 0;
  }

  const xp = claim(state.daily) + claim(state.weekly);

  saveQuestState(userId, state);
  return xp;
}

// =========================================================
// BLOCK C – Helper, Migration, Cleanup
// =========================================================

// ---------------------------------------------------------
// ensureProgress – stellt sicher, dass alle modernen Felder existieren --> gelöscht, da doppelt
// ---------------------------------------------------------


// ---------------------------------------------------------
// XP-MIGRATION – korrigiert alte/kaputte XP-Werte
// ---------------------------------------------------------

(function runXpMigration() {
  const key = "sprachhero_progress_v7";
  let p = JSON.parse(localStorage.getItem(key) || "{}");
  let changed = false;

  for (let uid in p) {
    const user = p[uid];
    if (!user) continue;

    // 1) totalXp sicherstellen
    if (typeof user.totalXp !== "number") {
      user.totalXp = 0;
      changed = true;
    }

    // 2) Negative XP korrigieren
    if (user.totalXp < 0) {
      console.warn("XP-Migration: Negative XP gefunden → korrigiert");
      user.totalXp = 0;
      changed = true;
    }

    // 3) Unrealistisch hohe XP normalisieren
    if (user.totalXp > 5000) {
      console.warn("XP-Migration: Alte Box-XP erkannt → normalisiert");
      user.totalXp = Math.floor(user.totalXp / 10);
      changed = true;
    }

    // 4) Level neu berechnen
    const newLevel = XP.getLevelFromXp(user.totalXp);
    if (user.level !== newLevel) {
      user.level = newLevel;
      changed = true;
    }
  }

  if (changed) {
    console.warn("XP-Migration: Änderungen gespeichert");
    localStorage.setItem(key, JSON.stringify(p));
  }
})();

// =========================================================
// BLOCK D – Finale Checks & Strukturübersicht
// =========================================================

// Diese Datei besteht jetzt aus 4 klaren Bereichen:
//
// A) Core Storage
//    - Users, Words, Progress, XP, Sessions
//    - Badges, Boosts, LearningPath
//
// B) Quest Engine V1
//    - Daily + Weekly + Dynamic Missions
//    - Reset, Progress, Claim
//
// C) Helper & Migration
//    - ensureProgress()
//    - XP-Migration
//
// D) Abschluss
//    - Keine alten Quest-Funktionen mehr
//    - Keine doppelten Keys
//    - Keine Konflikte
//    - Alle Exporte sind sauber

// ---------------------------------------------------------
// Sanity Check: Entferne alte Quest-Daten (einmalig)
// ---------------------------------------------------------

(function cleanupLegacyQuests() {
  // Altes System: questsDaily
  if (localStorage.getItem("questsDaily")) {
    console.warn("Legacy Quest-System gefunden → entfernt");
    localStorage.removeItem("questsDaily");
  }
})();
