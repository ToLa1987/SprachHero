// =========================================================
// SprachHero – QUEST ENGINE V1
// Komplett neues Missionssystem (Daily, Weekly, Gold)
// Pädagogisch, dynamisch, motivierend
// =========================================================

import {
  getCurrentUser
} from "../core/storage.js";

import {
  getQuestState,
  resetDailyQuests,
  resetWeeklyQuests,
  claimQuestReward
} from "../core/storage.js";

import {
  updateQuestProgress
} from "../core/storage.js";

import { playQuestSound } from "../ui/sound.js";
import { showQuestToast } from "../ui/toast.js";
import { xpFlyAnimation } from "../ui/xp-fly.js";

export function render() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  // =========================================================
  // RESET LOGIK (Daily / Weekly)
  // =========================================================

  const now = Date.now();
  const state = getQuestState(user.id);

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;

  // Daily Reset
  if (now - state.lastDailyReset > ONE_DAY) {
    resetDailyQuests(user.id);
  }

  // Weekly Reset
  if (now - state.lastWeeklyReset > ONE_WEEK) {
    resetWeeklyQuests(user.id);
  }

  const { daily, weekly } = getQuestState(user.id);

  // =========================================================
  // UI START
  // =========================================================

  app.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "quests-wrapper";
  app.appendChild(wrapper);

  const title = document.createElement("h2");
  title.textContent = "Missionen";
  wrapper.appendChild(title);

  // =========================================================
  // DAILY SECTION
  // =========================================================

  const dailyBlock = document.createElement("div");
  dailyBlock.className = "quest-section";
  dailyBlock.innerHTML = `<h3>Daily Missionen</h3>`;
  wrapper.appendChild(dailyBlock);

  const dailyList = document.createElement("div");
  dailyList.className = "quest-list";
  dailyBlock.appendChild(dailyList);

  daily.forEach(q => dailyList.appendChild(renderQuestCard(user, q)));

  // =========================================================
  // WEEKLY SECTION
  // =========================================================

  const weeklyBlock = document.createElement("div");
  weeklyBlock.className = "quest-section";
  weeklyBlock.innerHTML = `<h3>Weekly Missionen</h3>`;
  wrapper.appendChild(weeklyBlock);

  const weeklyList = document.createElement("div");
  weeklyList.className = "quest-list";
  weeklyBlock.appendChild(weeklyList);

  weekly.forEach(q => weeklyList.appendChild(renderQuestCard(user, q)));
}

// =========================================================
// QUEST CARD RENDERING
// =========================================================

function renderQuestCard(user, q) {
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

  const card = document.createElement("div");
  card.className = "quest-card";

  if (q.gold) card.classList.add("gold");

  card.innerHTML = `
    <div class="quest-header">
      <span class="quest-icon">${q.icon || "🎯"}</span>
      <div class="quest-info">
        <strong>${q.text}</strong>
        <div class="quest-category">${q.category}</div>
      </div>
    </div>

    <div class="quest-progress">
      <div class="quest-progress-bar">
        <div class="quest-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="quest-progress-text">${q.progress} / ${q.target}</div>
    </div>

    ${q.done ? `<div class="quest-reward">Belohnung: +${q.reward} XP</div>` : ""}
  `;

  // CLAIM BUTTON
  if (q.done && !q.claimed) {
    const btn = document.createElement("button");
    btn.className = "quest-claim-btn";
    btn.textContent = "Belohnung abholen";

    btn.onclick = () => {
      const xp = claimQuestReward(user.id, q.id);
      playQuestSound();
      showQuestToast(q.id);
      xpFlyAnimation(btn, xp);
      render();
    };

    card.appendChild(btn);
  }

  return card;
}
