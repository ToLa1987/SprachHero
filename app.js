// =========================================================
// app.js – SprachHero V8.7.1
// Einstiegspunkt: Navigation, Initialisierung, Startscreen
// =========================================================

import { applyDarkMode, updateXpDisplay } from "./src/core/utils.js";
import { navigate } from "./src/core/navigation.js";
import { getCurrentUser } from "./src/core/storage.js";
import { playQuestSound } from "./src/ui/sound.js";
import { showQuestToast, showBoostToast } from "./src/ui/toast.js";
import { playAchievementSound } from "./src/ui/sound.js";
import { showAchievementToast } from "./src/ui/toast.js";
import { initVoices } from "./src/core/audio.js";

initVoices();

// =========================================================
// HERO INTRO (Flying Hero)
// =========================================================

window.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("hero-intro");
  if (intro) {
    setTimeout(() => {
      intro.remove();
    }, 8000); // Logo + Schriftzug synchron verschwinden
  }
});

// =========================================================
// EVENT LISTENER
// =========================================================

window.addEventListener("questCompleted", (e) => {
  const questId = e.detail.questId;
  showQuestToast(questId);
  playQuestSound();
});

window.addEventListener("boostActivated", (e) => {
  const { multiplier } = e.detail;
  showBoostToast(multiplier);
});

// XP gewonnen → XP-Anzeige aktualisieren
window.addEventListener("xpGained", () => updateXpDisplay());

// Achievement freigeschaltet → Toast + Sound
window.addEventListener("achievementUnlocked", (e) => {
  const key = e.detail.key;
  showAchievementToast(key);
  playAchievementSound(key);
});

// =========================================================
// INITIALISIERUNG
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  applyDarkMode();
  updateXpDisplay();

  // Navigation Buttons verbinden
  document.querySelectorAll("#mainNav button").forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.page);
  });

  // ⭐ WICHTIG: Startscreen anzeigen
  navigate("start");
});
