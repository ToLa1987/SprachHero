// =========================================================
// storyEngine.js – SprachHero V16
// Verbesserte Freischaltung, Story-Reihenfolge, Achievements
// =========================================================

import {
  getUserTotalXp,
  getUserSession,
  getGlobalCorrectWrong,
  getWordsForLang,
  getGlobal
} from "../core/storage.js";

import { XP } from "../core/xp.js";
import { STORIES } from "./storyData.js";
import { updateQuestProgress } from "../core/storage.js";

// =========================================================
// CONSTANTS
// =========================================================

const STORY_PROGRESS_KEY = "sprachhero_story_progress_v2";
const ACH_STORE_KEY = "sprachhero_achievements_v2";
const SPEED_KEY = "sprachhero_story_speed_v1";
const STREAK_KEY = "sprachhero_story_streak_v1";
const LAST_STORY_KEY = "sprachhero_last_story_v1";

// Reihenfolge der Stories (für Story-Lock)
const STORY_ORDER = STORIES.map(s => s.id);

// =========================================================
// RAW STORAGE HELPERS
// =========================================================

function load(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

// =========================================================
// USER STORY PROGRESS
// =========================================================

export function getUserStoryProgress(userId) {
  const all = load(STORY_PROGRESS_KEY);
  return all[userId] || {};
}

export function setUserStoryProgress(userId, progress) {
  const all = load(STORY_PROGRESS_KEY);
  all[userId] = progress;
  save(STORY_PROGRESS_KEY, all);
}

// =========================================================
// ACHIEVEMENT REGISTRY
// =========================================================

export const ACHIEVEMENTS = {
  read_1_chapter: { category: "chapters", title: "Erstes Kapitel!", target: 1 },
  read_5_chapters: { category: "chapters", title: "5 Kapitel gelesen", target: 5 },
  read_10_chapters: { category: "chapters", title: "10 Kapitel gelesen", target: 10 },
  read_20_chapters: { category: "chapters", title: "20 Kapitel gelesen", target: 20 },
  read_30_chapters: { category: "chapters", title: "30 Kapitel gelesen", target: 30 },
  read_50_chapters: { category: "chapters", title: "50 Kapitel gelesen", target: 50 },
  read_100_chapters: { category: "chapters", title: "100 Kapitel gelesen", target: 100 },

  complete_magic_story: { category: "story", title: "Magie gemeistert!" },
  complete_comic_story: { category: "story", title: "Comic gemeistert!" },
  complete_school_story: { category: "story", title: "Schule gemeistert!" },

  ten_magic_chapters: { category: "style", title: "10 Magie-Kapitel" },
  ten_comic_chapters: { category: "style", title: "10 Comic-Kapitel" },
  ten_school_chapters: { category: "style", title: "10 Schul-Kapitel" },

  magic_master_50: { category: "style", title: "Magie-Meister 50" },
  comic_master_50: { category: "style", title: "Comic-Meister 50" },
  school_master_50: { category: "style", title: "Schul-Meister 50" },

  magic_master_100: { category: "style", title: "Magie-Meister 100" },
  comic_master_100: { category: "style", title: "Comic-Meister 100" },
  school_master_100: { category: "style", title: "Schul-Meister 100" },

  magic_master_200: { category: "style", title: "Magie-Meister 200" },
  comic_master_200: { category: "style", title: "Comic-Meister 200" },
  school_master_200: { category: "style", title: "Schul-Meister 200" },

  speed_3_in_10: { category: "speed", title: "3 Kapitel in 10 Minuten" },
  speed_5_in_10: { category: "speed", title: "5 Kapitel in 10 Minuten" },

  streak_7_days: { category: "streak", title: "7 Tage Story-Streak" },
  streak_14_days: { category: "streak", title: "14 Tage Story-Streak" },
  streak_30_days: { category: "streak", title: "30 Tage Story-Streak" },

  quests_5: { category: "quests", title: "5 Quests abgeschlossen" },
  quests_10: { category: "quests", title: "10 Quests abgeschlossen" },
  quests_25: { category: "quests", title: "25 Quests abgeschlossen" },
  quests_50: { category: "quests", title: "50 Quests abgeschlossen" },
  quests_100: { category: "quests", title: "100 Quests abgeschlossen" },

  three_stories_completed: { category: "special", title: "3 Stories abgeschlossen" },
  all_stories_completed: { category: "special", title: "Alle Stories abgeschlossen" },
  completion_100_percent: { category: "special", title: "100% Story-Fortschritt" },
  story_master: { category: "special", title: "Story-Master" }
};

// =========================================================
// ACHIEVEMENT STORAGE + TRIGGER
// =========================================================

export function getAchievements(userId) {
  const all = load(ACH_STORE_KEY);
  return all[userId] || {};
}

export function unlockAchievement(userId, key) {
  const all = load(ACH_STORE_KEY);
  all[userId] = all[userId] || {};

  if (all[userId][key]) return;

  all[userId][key] = true;
  save(ACH_STORE_KEY, all);

  const meta = ACHIEVEMENTS[key] || {};

  window.dispatchEvent(
    new CustomEvent("achievementUnlocked", {
      detail: {
        key,
        title: meta.title || key,
        category: meta.category || "misc"
      }
    })
  );
}

// =========================================================
// STORY-REIHENFOLGE-LOCK
// =========================================================

function isStoryUnlockedForUser(userId, storyId) {
  const progress = getUserStoryProgress(userId);
  const index = STORY_ORDER.indexOf(storyId);

  if (index <= 0) return true; // erste Story immer frei

  const prevId = STORY_ORDER[index - 1];
  const prevStory = STORIES.find(s => s.id === prevId);

  if (!prevStory) return true;

  const read = Object.keys(progress[prevId]?.readChapters || {}).length;
  const total = prevStory.chapters.length;

  return read === total; // vorherige Story komplett gelesen?
}

// =========================================================
// KAPITEL LESEN
// =========================================================

export function markChapterRead(userId, storyId, chapterId) {
  const progress = getUserStoryProgress(userId);

  progress[storyId] = progress[storyId] || {
    readChapters: {},
    completedQuests: {},
    style: null
  };

  if (progress[storyId].readChapters[chapterId]) return;

  progress[storyId].readChapters[chapterId] = true;

  XP.addXP(userId, 20);
  updateQuestProgress(userId, "xp", 20);

  const storyData = STORIES.find(s => s.id === storyId);
  if (storyData?.style) progress[storyId].style = storyData.style;

  setUserStoryProgress(userId, progress);

  checkChapterAchievements(userId);
  checkStorySpecialAchievements(userId);
  checkSpeedAchievements(userId);
  checkStoryStreak(userId);
}

// =========================================================
// KAPITEL-MEILENSTEINE
// =========================================================

export function checkChapterAchievements(userId) {
  const all = getUserStoryProgress(userId);

  let total = 0;
  Object.values(all).forEach(s => {
    total += Object.keys(s.readChapters || {}).length;
  });

  const milestones = [1, 5, 10, 20, 30, 50, 100];
  milestones.forEach(m => {
    if (total >= m) unlockAchievement(userId, `read_${m}_chapters`);
  });

  // Story-Abschluss
  STORIES.forEach(story => {
    const p = all[story.id]?.readChapters || {};
    const read = Object.keys(p).length;
    const totalCh = story.chapters.length;

    if (read === totalCh) {
      XP.addXP(userId, 50); // entschärft
      unlockAchievement(userId, `complete_${story.style}_story`);
    }
  });

  // Stil 10 Kapitel
  ["magic", "comic", "school"].forEach(style => {
    let count = 0;

    Object.values(all).forEach(s => {
      if (s.style === style) {
        count += Object.keys(s.readChapters || {}).length;
      }
    });

    if (count >= 10) unlockAchievement(userId, `ten_${style}_chapters`);
  });
}

// =========================================================
// SPEED
// =========================================================

export function checkSpeedAchievements(userId) {
  const data = load(SPEED_KEY);
  const now = Date.now();

  data[userId] = data[userId] || [];
  data[userId].push(now);

  data[userId] = data[userId].filter(t => now - t <= 10 * 60 * 1000);
  save(SPEED_KEY, data);

  if (data[userId].length >= 3) unlockAchievement(userId, "speed_3_in_10");
  if (data[userId].length >= 5) unlockAchievement(userId, "speed_5_in_10");
}

// =========================================================
// STREAK
// =========================================================

export function checkStoryStreak(userId) {
  const data = load(STREAK_KEY);

  data[userId] = data[userId] || { last: null, streak: 0 };

  const today = new Date().toDateString();
  const s = data[userId];

  if (s.last !== today) {
    if (s.last) {
      const diff =
        (new Date(today) - new Date(s.last)) / (1000 * 60 * 60 * 24);
      s.streak = diff === 1 ? s.streak + 1 : 1;
    } else {
      s.streak = 1;
    }

    s.last = today;
    save(STREAK_KEY, data);
  }

  if (s.streak >= 7) unlockAchievement(userId, "streak_7_days");
  if (s.streak >= 14) unlockAchievement(userId, "streak_14_days");
  if (s.streak >= 30) unlockAchievement(userId, "streak_30_days");
}

// =========================================================
// USER STATS
// =========================================================

export function getUserStats(userId, lang) {
  const xp = getUserTotalXp(userId);
  const session = getUserSession(userId);

  const totalSeconds = session.totalSeconds || 0;
  const sessionsCompleted = session.sessionsCompleted || 0;

  const words = getWordsForLang(lang) || [];
  const { correct, wrong } = getGlobalCorrectWrong(userId, lang);

  const totalAnswers = correct + wrong;
  const success =
    totalAnswers > 0 ? Math.round((correct / totalAnswers) * 100) : 0;

  return {
    xp,
    sessionsCompleted,
    wordsCount: words.length,
    success
  };
}

// =========================================================
// STORY PROGRESS PERCENT
// =========================================================

export function getStoryProgressPercent(userId, story) {
  const progress = getUserStoryProgress(userId);
  const s = progress[story.id] || { readChapters: {} };

  const total = story.chapters.length || 1;
  const readCount = Object.keys(s.readChapters || {}).length;

  return Math.round((readCount / total) * 100);
}

// =========================================================
// FREISCHALTLOGIK
// =========================================================

export function isChapterUnlocked(userId, lang, chapter) {
  const stats = getUserStats(userId, lang);
  const u = chapter.unlock || {};

  // Story finden
  const story = STORIES.find(s =>
    s.chapters.some(ch => ch.id === chapter.id)
  );

  // Story-Lock
  if (story && !isStoryUnlockedForUser(userId, story.id)) {
    return false;
  }

  if (stats.xp < (u.minXp || 0)) return false;
  if (stats.sessionsCompleted < (u.minSessions || 0)) return false;
  if (stats.wordsCount < (u.minWords || 0)) return false;
  if (stats.success < (u.minSuccess || 0)) return false;

  return true;
}

// =========================================================
// LOCK REASONS
// =========================================================

export function getChapterLockReason(userId, lang, chapter) {
  const stats = getUserStats(userId, lang);
  const u = chapter.unlock || {};
  const reasons = [];

  // Story finden
  const story = STORIES.find(s =>
    s.chapters.some(ch => ch.id === chapter.id)
  );

  // Story-Lock prüfen
  if (story && !isStoryUnlockedForUser(userId, story.id)) {
    reasons.push("Vorherige Story abschließen");
    return reasons; // wichtig: keine weiteren Gründe anzeigen
  }

  // Normale Kapitel-Bedingungen
  if (stats.xp < (u.minXp || 0))
    reasons.push(`XP: ${stats.xp}/${u.minXp}`);

  if (stats.sessionsCompleted < (u.minSessions || 0))
    reasons.push(`Sessions: ${stats.sessionsCompleted}/${u.minSessions}`);

  if (stats.wordsCount < (u.minWords || 0))
    reasons.push(`Wörter: ${stats.wordsCount}/${u.minWords}`);

  if (stats.success < (u.minSuccess || 0))
    reasons.push(`Erfolg: ${stats.success}%/${u.minSuccess}%`);

  return reasons;
}


// =========================================================
// QUEST STATUS (für Story-Quests)
// =========================================================

export function getQuestStatus(userId, lang, storyId, quest) {
  if (isQuestCompleted(userId, storyId, quest.id)) {
    return { done: true, progressText: "Abgeschlossen" };
  }

  const stats = getUserStats(userId, lang);

  let current = 0;
  if (quest.type === "xp") current = stats.xp;
  if (quest.type === "words") current = stats.wordsCount;
  if (quest.type === "sessions") current = stats.sessionsCompleted;
  if (quest.type === "success") current = stats.success;

  const target = quest.amount || 0;
  const done = current >= target;

  return {
    done,
    progressText: `${current}/${target}`
  };
}

// =========================================================
// QUESTS
// =========================================================

export function markQuestCompleted(userId, storyId, questId) {
  const progress = getUserStoryProgress(userId);

  progress[storyId] = progress[storyId] || {
    readChapters: {},
    completedQuests: {},
    style: null
  };

  progress[storyId].completedQuests[questId] = true;
  setUserStoryProgress(userId, progress);

  const ach = getAchievements(userId);
  const key = `quest_${storyId}_${questId}`;

  if (!ach[key]) unlockAchievement(userId, key);

  checkQuestAchievements(userId);
}

export function isQuestCompleted(userId, storyId, questId) {
  const p = getUserStoryProgress(userId)[storyId];
  return !!(p && p.completedQuests && p.completedQuests[questId]);
}

export function checkQuestAchievements(userId) {
  const ach = getAchievements(userId);
  const keys = Object.keys(ach).filter(k => k.startsWith("quest_"));

  const total = keys.length;

  if (total >= 5) unlockAchievement(userId, "quests_5");
  if (total >= 10) unlockAchievement(userId, "quests_10");
  if (total >= 25) unlockAchievement(userId, "quests_25");
  if (total >= 50) unlockAchievement(userId, "quests_50");
  if (total >= 100) unlockAchievement(userId, "quests_100");
}

// =========================================================
// STORY-SPEZIAL
// =========================================================

export function checkStorySpecialAchievements(userId) {
  const progress = getUserStoryProgress(userId);

  let completedStories = 0;
  let totalCh = 0;
  let readCh = 0;

  let magic = 0,
    comic = 0,
    school = 0;

  STORIES.forEach(story => {
    const p = progress[story.id]?.readChapters || {};
    const read = Object.keys(p).length;
    const total = story.chapters.length;

    totalCh += total;
    readCh += read;

    if (read === total) completedStories++;

    if (story.style === "magic") magic += read;
    if (story.style === "comic") comic += read;
    if (story.style === "school") school += read;
  });

  if (completedStories >= 3)
    unlockAchievement(userId, "three_stories_completed");

  if (completedStories === STORIES.length)
    unlockAchievement(userId, "all_stories_completed");

  if (readCh === totalCh && totalCh > 0)
    unlockAchievement(userId, "completion_100_percent");

  if (completedStories === STORIES.length)
    unlockAchievement(userId, "story_master");

  if (magic >= 50) unlockAchievement(userId, "magic_master_50");
  if (comic >= 50) unlockAchievement(userId, "comic_master_50");
  if (school >= 50) unlockAchievement(userId, "school_master_50");

  if (magic >= 100) unlockAchievement(userId, "magic_master_100");
  if (comic >= 100) unlockAchievement(userId, "comic_master_100");
  if (school >= 100) unlockAchievement(userId, "school_master_100");

  if (magic >= 200) unlockAchievement(userId, "magic_master_200");
  if (comic >= 200) unlockAchievement(userId, "comic_master_200");
  if (school >= 200) unlockAchievement(userId, "school_master_200");
}

// =========================================================
// LAST OPENED STORY
// =========================================================

export function setLastOpenedStory(storyId, chapterId) {
  save(LAST_STORY_KEY, { storyId, chapterId });
}

export function getLastOpenedStory() {
  return load(LAST_STORY_KEY, null);
}
