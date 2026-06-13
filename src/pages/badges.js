// =========================================================
// badges.js – SprachHero V14
// Premium-Badge-System ohne Filterleiste
// - Missionen kompakt
// - Accordion-Kategorien
// - Kachel-Badges (Freigeschaltet zuerst)
// - Story-Achievements sauber normalisiert
// =========================================================

import {
  getCurrentUser,
  getGlobal,
  getUserProgress,
  getLevel,
  getStreak,
  getXpHistory,
  getUserSession
} from "../core/storage.js";

import { getAchievements } from "../story/storyEngine.js";
import { playAchievementSound } from "../ui/sound.js";

export function render() {
  
  const tooltipText = {
  "500 XP erreicht": "Du hast schon richtig viel gelernt!",
  "1000 XP erreicht": "Wow! Du wirst immer besser!",
  "2000 XP erreicht": "Unglaublich! Du bist ein Lern-Profi!",

  "Streak 5 Tage": "5 Tage hintereinander gelernt – stark!",
  "Streak 10 Tage": "10 Tage am Stück – du bleibst dran!",
  "Streak 20 Tage": "20 Tage – echte Ausdauer!",

  "5 Minuten Session": "Du hast 5 Minuten fleißig geübt.",
  "10 Minuten Session": "10 Minuten Training – super!",
  "30 Minuten Session": "30 Minuten – du gibst Gas!",
  "60 Minuten Session": "1 Stunde gelernt – wow!",
  "120 Minuten Session": "2 Stunden – du bist ein Champion!",
  "10 Sessions abgeschlossen": "10 Lernrunden geschafft!",
  "20 Sessions abgeschlossen": "20 Sessions – stark!",
  "50 Sessions abgeschlossen": "50 Sessions – unglaubliche Leistung!",

  "1 Kapitel gelesen": "Du hast dein erstes Kapitel geschafft!",
  "5 Kapitel gelesen": "Schon 5 Kapitel – klasse!",
  "10 Kapitel gelesen": "10 Kapitel – du liest wie ein Profi!",
  "20 Kapitel gelesen": "20 Kapitel – du bist ein Bücherheld!",
  "30 Kapitel gelesen": "30 Kapitel – beeindruckend!",
  "50 Kapitel gelesen": "50 Kapitel – du bist ein Meisterleser!",
  "100 Kapitel gelesen": "100 Kapitel – du bist eine Legende!",

  "Magic-Story abgeschlossen": "Du hast die magische Welt gemeistert!",
  "Comic-Story abgeschlossen": "Du hast das Comic-Abenteuer beendet!",
  "School-Story abgeschlossen": "Du hast die Schulstory abgeschlossen!",

  "5 Quests abgeschlossen": "5 Aufgaben geschafft – super!",
  "10 Quests abgeschlossen": "10 Quests – du bist fleißig!",
  "25 Quests abgeschlossen": "25 Quests – stark!",
  "50 Quests abgeschlossen": "50 Quests – wow!",
  "100 Quests abgeschlossen": "100 Quests – du bist ein Quest-Meister!",

  "10 Magic-Kapitel": "Du liebst Magie – weiter so!",
  "10 Comic-Kapitel": "Du bist ein Comic-Held!",
  "10 School-Kapitel": "Du rockst die Schulstory!",

  "50 Magic-Kapitel": "50 magische Kapitel – du bist ein Zaubermeister!",
  "50 Comic-Kapitel": "50 Comic-Kapitel – du bist ein Superheld!",
  "50 School-Kapitel": "50 Schulkapitel – du bist ein Klassenstar!",

  "7 Tage Story-Streak": "7 Tage hintereinander gelesen – stark!",
  "14 Tage Story-Streak": "2 Wochen am Stück – wow!",
  "30 Tage Story-Streak": "1 Monat Story-Power!",

  "3 Kapitel in 10 Minuten": "Du liest richtig schnell!",
  "5 Kapitel in 10 Minuten": "Du bist ein Turbo-Leser!"
};

  
    const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  app.innerHTML = "";

  const g = getGlobal();
  const progress = getUserProgress(user.id) || {};
  const xp = progress.totalXp || 0;
  const level = getLevel(xp);
  const streak = getStreak(user.id);
  const history = getXpHistory();
  const userHistory = history[user.id] || {};
  const session = getUserSession(user.id);

  const totalSeconds = session.totalSeconds || 0;
  const sessionsCompleted = session.sessionsCompleted || 0;

  // =========================================================
  // HEADER
  // =========================================================

  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <h2>Badges & Ziele</h2>
    <p class="small">Dein Fortschritt in XP, Streak, Sessions & Story-Abenteuern</p>
  `;
  app.appendChild(header);

  // =========================================================
  // MISSIONEN
  // =========================================================

  const missionsCard = document.createElement("div");
  missionsCard.className = "card";
  missionsCard.innerHTML = `<h3>Missionen</h3>`;

  const missionGrid = document.createElement("div");
  missionGrid.className = "mission-grid";
  missionsCard.appendChild(missionGrid);
  app.appendChild(missionsCard);

  function mission(title, icon, current, target) {
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    const m = document.createElement("div");
    m.className = "mission-card";
    m.innerHTML = `
      <div style="font-size:22px; margin-bottom:4px;">${icon}</div>
      <strong>${title}</strong>
      <p>${current} / ${target}</p>
      <div style="background:#ddd; height:8px; border-radius:6px; overflow:hidden;">
        <div style="width:${pct}%; background:#4caf50; height:8px;"></div>
      </div>
    `;
    missionGrid.appendChild(m);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayXp = userHistory[today] || 0;
  const weekXp = Object.values(userHistory).reduce((a, b) => a + b, 0);

  mission("Tagesziel XP", "🔥", todayXp, g.dailyGoal || 30);
  mission("Wochensumme XP", "📆", weekXp, g.weeklyGoal || 150);
  mission("Level-Aufstieg", "⭐", xp, level * 100);
  mission("Streak", "📈", streak.current, Math.max(5, streak.best || 5));

  // =========================================================
  // ACCORDION
  // =========================================================

  function createAccordion(title) {
    const item = document.createElement("div");
    item.className = "badge-accordion-item";

    const header = document.createElement("div");
    header.className = "badge-accordion-header";
    header.innerHTML = `${title} <span>▼</span>`;

    const content = document.createElement("div");
    content.className = "badge-accordion-content";

    header.onclick = () => {
      const open = content.classList.contains("open");
      document.querySelectorAll(".badge-accordion-content").forEach(c => c.classList.remove("open"));
      if (!open) content.classList.add("open");
    };

    item.appendChild(header);
    item.appendChild(content);
    app.appendChild(item);

    return content;
  }

  // =========================================================
  // BADGE-RENDERING
  // =========================================================

function badge(container, title, icon, unlocked, progressPct = null) {
  const b = document.createElement("div");
  b.className = "badge-card " + (unlocked ? "unlocked" : "locked");


  const text = tooltipText[title] || "Keine Beschreibung verfügbar";

b.innerHTML = `
  <div style="font-size:32px;">${icon}</div>
  <strong>${title}</strong>
  ${
    progressPct !== null
      ? `<div class="badge-progress"><div class="badge-progress-fill" style="width:${progressPct}%"></div></div>`
      : ""
  }
`;

b.dataset.tooltip = text;


  if (unlocked) {
    b.onclick = () => playAchievementSound(title.toLowerCase());
  }

  container.appendChild(b);
}


  // =========================================================
  // KATEGORIEN
  // =========================================================

  const xpBox = createAccordion("XP-Badges");
  const streakBox = createAccordion("Streak-Badges");
  const sessionBox = createAccordion("Session-Badges");
  const storyBox = createAccordion("Story-Achievements");
  const speedBox = createAccordion("Speed-Badges");
  const marathonBox = createAccordion("Marathon-Badges");

  // =========================================================
  // STORY-ACHIEVEMENTS NORMALISIEREN
  // =========================================================

  const storyAchRaw = getAchievements(user.id) || {};

  const normalize = key => storyAchRaw[key] === true;

  const storyAch = {
    read_1_chapter: normalize("read_1_chapter"),
    read_5_chapters: normalize("read_5_chapters"),
    read_10_chapters: normalize("read_10_chapters"),
    read_20_chapters: normalize("read_20_chapters"),
    read_30_chapters: normalize("read_30_chapters"),
    read_50_chapters: normalize("read_50_chapters"),
    read_100_chapters: normalize("read_100_chapters"),

    complete_magic_story: normalize("complete_magic_story"),
    complete_comic_story: normalize("complete_comic_story"),
    complete_school_story: normalize("complete_school_story"),

    quests_5: normalize("quests_5"),
    quests_10: normalize("quests_10"),
    quests_25: normalize("quests_25"),
    quests_50: normalize("quests_50"),
    quests_100: normalize("quests_100"),

    ten_magic_chapters: normalize("ten_magic_chapters"),
    ten_comic_chapters: normalize("ten_comic_chapters"),
    ten_school_chapters: normalize("ten_school_chapters"),

    magic_master_50: normalize("magic_master_50"),
    comic_master_50: normalize("comic_master_50"),
    school_master_50: normalize("school_master_50"),

    streak_7_days: normalize("streak_7_days"),
    streak_14_days: normalize("streak_14_days"),
    streak_30_days: normalize("streak_30_days"),

    speed_3_in_10: normalize("speed_3_in_10"),
    speed_5_in_10: normalize("speed_5_in_10")
  };

  // =========================================================
  // BADGE-DEFINITION (ALLE mit echten Namen)
  // =========================================================

  const badgeDefs = [
    // XP
    { box: xpBox, title: "500 XP erreicht", icon: "💠", unlocked: xp >= 500 },
    { box: xpBox, title: "1000 XP erreicht", icon: "💎", unlocked: xp >= 1000 },
    { box: xpBox, title: "2000 XP erreicht", icon: "🔷", unlocked: xp >= 2000 },

    // Streak
    { box: streakBox, title: "Streak 5 Tage", icon: "🔥", unlocked: streak.best >= 5 },
    { box: streakBox, title: "Streak 10 Tage", icon: "⚡", unlocked: streak.best >= 10 },
    { box: streakBox, title: "Streak 20 Tage", icon: "🌟", unlocked: streak.best >= 20 },

    // Sessions
    { box: sessionBox, title: "5 Minuten Session", icon: "⏱️", unlocked: totalSeconds >= 5 * 60 },
    { box: sessionBox, title: "10 Minuten Session", icon: "⏱️", unlocked: totalSeconds >= 10 * 60 },
    { box: sessionBox, title: "30 Minuten Session", icon: "⏱️", unlocked: totalSeconds >= 30 * 60 },
    { box: sessionBox, title: "60 Minuten Session", icon: "⏱️", unlocked: totalSeconds >= 60 * 60 },
    { box: sessionBox, title: "120 Minuten Session", icon: "⏱️", unlocked: totalSeconds >= 120 * 60 },
    { box: sessionBox, title: "10 Sessions abgeschlossen", icon: "🎯", unlocked: sessionsCompleted >= 10 },
    { box: sessionBox, title: "20 Sessions abgeschlossen", icon: "🎯", unlocked: sessionsCompleted >= 20 },
    { box: sessionBox, title: "50 Sessions abgeschlossen", icon: "🎯", unlocked: sessionsCompleted >= 50 },

    // Story – Kapitel
    { box: storyBox, title: "1 Kapitel gelesen", icon: "📘", unlocked: storyAch.read_1_chapter },
    { box: storyBox, title: "5 Kapitel gelesen", icon: "📗", unlocked: storyAch.read_5_chapters },
    { box: storyBox, title: "10 Kapitel gelesen", icon: "📙", unlocked: storyAch.read_10_chapters },
    { box: storyBox, title: "20 Kapitel gelesen", icon: "📕", unlocked: storyAch.read_20_chapters },
    { box: storyBox, title: "30 Kapitel gelesen", icon: "📚", unlocked: storyAch.read_30_chapters },
    { box: storyBox, title: "50 Kapitel gelesen", icon: "📚", unlocked: storyAch.read_50_chapters },
    { box: storyBox, title: "100 Kapitel gelesen", icon: "🏅", unlocked: storyAch.read_100_chapters },

    // Story – Welten
    { box: storyBox, title: "Magic-Story abgeschlossen", icon: "🔮", unlocked: storyAch.complete_magic_story },
    { box: storyBox, title: "Comic-Story abgeschlossen", icon: "🦸", unlocked: storyAch.complete_comic_story },
    { box: storyBox, title: "School-Story abgeschlossen", icon: "🏫", unlocked: storyAch.complete_school_story },

    // Story – Quests
    { box: storyBox, title: "5 Quests abgeschlossen", icon: "🎯", unlocked: storyAch.quests_5 },
    { box: storyBox, title: "10 Quests abgeschlossen", icon: "🎯", unlocked: storyAch.quests_10 },
    { box: storyBox, title: "25 Quests abgeschlossen", icon: "🎯", unlocked: storyAch.quests_25 },
    { box: storyBox, title: "50 Quests abgeschlossen", icon: "🎯", unlocked: storyAch.quests_50 },
    { box: storyBox, title: "100 Quests abgeschlossen", icon: "🎯", unlocked: storyAch.quests_100 },

    // Story – Stil
    { box: storyBox, title: "10 Magic-Kapitel", icon: "🔮", unlocked: storyAch.ten_magic_chapters },
    { box: storyBox, title: "10 Comic-Kapitel", icon: "🖍️", unlocked: storyAch.ten_comic_chapters },
    { box: storyBox, title: "10 School-Kapitel", icon: "🏫", unlocked: storyAch.ten_school_chapters },

    { box: storyBox, title: "50 Magic-Kapitel", icon: "🔮👑", unlocked: storyAch.magic_master_50 },
    { box: storyBox, title: "50 Comic-Kapitel", icon: "🎨👑", unlocked: storyAch.comic_master_50 },
    { box: storyBox, title: "50 School-Kapitel", icon: "🏫👑", unlocked: storyAch.school_master_50 },

    // Marathon
    { box: marathonBox, title: "7 Tage Story-Streak", icon: "🔥", unlocked: storyAch.streak_7_days },
    { box: marathonBox, title: "14 Tage Story-Streak", icon: "🔥🔥", unlocked: storyAch.streak_14_days },
    { box: marathonBox, title: "30 Tage Story-Streak", icon: "🔥🔥🔥", unlocked: storyAch.streak_30_days },

    // Speed
    { box: speedBox, title: "3 Kapitel in 10 Minuten", icon: "⚡", unlocked: storyAch.speed_3_in_10 },
    { box: speedBox, title: "5 Kapitel in 10 Minuten", icon: "⚡⚡", unlocked: storyAch.speed_5_in_10 }
  ];

  // =========================================================
  // SORTIERUNG: Freigeschaltet zuerst
  // =========================================================

  badgeDefs.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));

  // =========================================================
  // RENDERING
  // =========================================================

  function renderBadges() {
    document.querySelectorAll(".badge-accordion-content").forEach(c => (c.innerHTML = ""));

    badgeDefs.forEach(b => {
      badge(b.box, b.title, b.icon, b.unlocked);
    });
  }

  renderBadges();
  initBadgeTooltips();
  function initBadgeTooltips() {
  let tooltip = document.querySelector(".global-badge-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "global-badge-tooltip";
    document.body.appendChild(tooltip);
  }

  const cards = document.querySelectorAll(".badge-card");

  cards.forEach(card => {
    const text = card.dataset.tooltip;
    if (!text) return;

    card.addEventListener("mouseenter", e => {
      tooltip.textContent = text;
      tooltip.style.opacity = "1";
      positionTooltip(e, tooltip);
    });

    card.addEventListener("mousemove", e => {
      positionTooltip(e, tooltip);
    });

    card.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";
    });
  });
}

function positionTooltip(e, tooltip) {
  const offset = 12; // Abstand zur Maus
  let x = e.clientX + offset;
  let y = e.clientY;

  const rect = tooltip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (x + rect.width > vw - 8) x = vw - rect.width - 8;
  if (y + rect.height > vh - 8) y = vh - rect.height - 8;

  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}

}
