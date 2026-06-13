// =========================================================
// /src/core/xp.js – XP Engine (Option B)
// =========================================================

import {
  getUserProgress,
  setUserProgress,
  addXpToHistory,
  getActiveBoost
} from "./storage.js";


export const XP = {
  addXP(userId, amount) {
    if (!userId || !amount) return;

    // 1) Boost berücksichtigen
    const boost = getActiveBoost(userId);
    if (boost) {
      amount = Math.floor(amount * boost.multiplier);
    }

    // 2) Progress laden
    const progress = getUserProgress(userId);
    const oldXp = progress.totalXp || 0;

    // 3) XP anwenden
    progress.totalXp = oldXp + amount;

    // 4) Level berechnen
    const xp = progress.totalXp;
    const level = this.getLevelFromXp(xp);
    progress.level = level;

    // 5) Speichern
    setUserProgress(userId, progress);

    // 6) XP-History
    addXpToHistory(userId, amount);

    // 7) Event: XP gewonnen
    window.dispatchEvent(new CustomEvent("xpGained", {
      detail: { userId, amount, xp, level }
    }));

    // 8) Event: LevelUp
    if (this.isLevelUp(oldXp, xp)) {
      window.dispatchEvent(new CustomEvent("levelUp", {
        detail: { userId, level }
      }));
    }
  },

    // Level‑Formel Option B: Level * 300 XP
    getLevelFromXp(xp) {
        let level = 1;
        let needed = 300;

        while (xp >= needed) {
            xp -= needed;
            level++;
            needed = level * 300;
        }
        return level;
    },

    isLevelUp(oldXp, newXp) {
        return this.getLevelFromXp(newXp) > this.getLevelFromXp(oldXp);
    }
};
