// =========================================================
// /src/core/xp.js – XP Engine (Option B)
// =========================================================

import {
  getLevel,
  getUserProgress,
  setUserProgress,
  addXpToHistory,
  getActiveBoost
} from "./storage.js";


export const XP = {
  addXP(userId, amount) {
    if (!userId || !Number.isFinite(amount) || amount === 0) return 0;

    // 1) Boost berücksichtigen
    const boost = getActiveBoost(userId);
    if (boost) {
      amount = Math.floor(amount * boost.multiplier);
    }

    // 2) Progress laden
    const progress = getUserProgress(userId);
    const storedXp = Number(progress.totalXp);
    const oldXp = Number.isFinite(storedXp) ? Math.max(0, storedXp) : 0;

    // 3) XP anwenden
    const newXp = Math.max(0, oldXp + amount);
    const appliedAmount = newXp - oldXp;
    progress.totalXp = newXp;

    // 4) Level berechnen
    const level = this.getLevelFromXp(newXp);
    progress.level = level;

    // 5) Speichern
    setUserProgress(userId, progress);

    // 6) XP-History
    addXpToHistory(userId, appliedAmount);

    // 7) Event: XP gewonnen
    window.dispatchEvent(new CustomEvent("xpGained", {
      detail: { userId, amount: appliedAmount, xp: newXp, level }
    }));

    // 8) Event: LevelUp
    if (this.isLevelUp(oldXp, newXp)) {
      window.dispatchEvent(new CustomEvent("levelUp", {
        detail: { userId, level }
      }));
    }

    return appliedAmount;
  },

    // Zentrale Level-Berechnung aus storage.js für alle App-Ansichten.
    getLevelFromXp(xp) {
        return getLevel(xp);
    },

    isLevelUp(oldXp, newXp) {
        return this.getLevelFromXp(newXp) > this.getLevelFromXp(oldXp);
    }
};
