// =========================================================
// story.js – SprachHero V17 (Accordion-Version)
// Kompakte Story-Kacheln + eingerückte Kapitel
// =========================================================

import { getCurrentUser, getGlobal } from "../core/storage.js";
import { STORIES } from "./storyData.js";

import {
  getUserStoryProgress,
  markChapterRead,
  getQuestStatus,
  isChapterUnlocked,
  getChapterLockReason,
  getStoryProgressPercent,
  setLastOpenedStory
} from "./storyEngine.js";

import { updateQuestProgress } from "../core/storage.js";

export function render() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("../pages/start.js").then(m => m.render());
    return;
  }

  const lang = getGlobal().language;
  app.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <h2>Story-Modus</h2>
    <p class="small">
      Aktive Sprache: <strong>${lang.toUpperCase()}</strong> – Nutzer: ${user.name}
    </p>
    <p class="small">Wähle eine Story-Welt und schalte Kapitel durch dein Training frei.</p>
  `;
  app.appendChild(header);

  // Accordion-Container
  const accordion = document.createElement("div");
  accordion.className = "story-accordion";
  app.appendChild(accordion);

  // =========================================================
  // Story + Kapitel rendern
  // =========================================================

  STORIES.forEach(story => {
    const pct = getStoryProgressPercent(user.id, story);

    // Story-Header
    const header = document.createElement("div");
    header.className = "story-header";

    header.innerHTML = `
      <div>
        <div class="story-header-title">${story.title}</div>
        <div class="story-header-desc">${story.description || ""}</div>
      </div>
      <div class="story-header-progress">${pct}%</div>
    `;

    accordion.appendChild(header);

    // Kapitel-Liste
    const chapterList = document.createElement("div");
    chapterList.className = "story-chapter-list";
    accordion.appendChild(chapterList);

    // Klick: Accordion öffnen/schließen
    header.onclick = () => {
      // alle anderen schließen
      accordion.querySelectorAll(".story-chapter-list").forEach(list => {
        if (list !== chapterList) list.classList.remove("open");
      });

      chapterList.classList.toggle("open");
    };

    // Kapitel rendern
    story.chapters.forEach((ch, index) => {
      const unlocked = isChapterUnlocked(user.id, lang, ch);
      const lockReasons = unlocked ? [] : getChapterLockReason(user.id, lang, ch);

      const item = document.createElement("div");
      item.className = "story-chapter-card";

      item.innerHTML = `
        <strong>${ch.title}</strong>
        <div class="small" style="color:${unlocked ? "#4caf50" : "#e53935"}">
          ${unlocked ? "Freigeschaltet" : "Gesperrt"}
        </div>
      `;

      if (!unlocked && lockReasons.length > 0) {
        const lockP = document.createElement("div");
        lockP.className = "story-lock-info";
        lockP.textContent = "Benötigt: " + lockReasons.join(" · ");
        item.appendChild(lockP);
      }

      const btn = document.createElement("button");
      btn.className = "btn-primary";
      btn.textContent = unlocked ? "Kapitel lesen" : "Noch gesperrt";
      btn.disabled = !unlocked;

      btn.onclick = () => {
        if (!unlocked) return;
        openChapterModal(story, index);
      };

      item.appendChild(btn);
      chapterList.appendChild(item);
    });
  });

  // =========================================================
  // Modal
  // =========================================================

  let modal = null;

  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "story-modal-overlay hidden";

    modal.innerHTML = `
      <div class="story-modal-card">
        <div class="story-modal-header">
          <h3 id="storyModalTitle"></h3>
          <button class="story-modal-close">×</button>
        </div>

        <div id="storyProgressBar" class="story-progress"></div>

        <div id="storyModalBody" class="story-modal-body"></div>

        <div class="story-modal-nav">
          <button class="btn-secondary" id="storyPrevBtn">← Vorheriges Kapitel</button>
          <button class="btn-primary" id="storyNextBtn">Weiterlesen →</button>
        </div>
      </div>
    `;

document.getElementById("story-overlay-root").appendChild(modal);

    modal.querySelector(".story-modal-close").onclick = () => closeModal();
    modal.onclick = e => { if (e.target === modal) closeModal(); };

    return modal;
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  // =========================================================
  // Kapitel öffnen
  // =========================================================

  function openChapterModal(story, chapterIndex) {
    const modal = ensureModal();
    const chapter = story.chapters[chapterIndex];

    const titleEl = modal.querySelector("#storyModalTitle");
    const bodyEl = modal.querySelector("#storyModalBody");
    const progressBar = modal.querySelector("#storyProgressBar");
    const prevBtn = modal.querySelector("#storyPrevBtn");
    const nextBtn = modal.querySelector("#storyNextBtn");

    titleEl.textContent = chapter.title;

    const total = story.chapters.length;
    const pct = Math.round(((chapterIndex + 1) / total) * 100);
    progressBar.style.width = pct + "%";

    bodyEl.innerHTML = "";

    const info = document.createElement("div");
    info.className = "small";
    info.style.opacity = "0.7";
    info.textContent = `Kapitel ${chapterIndex + 1} von ${total}`;
    bodyEl.appendChild(info);

// Bild + Text in gemeinsamen Container (responsives 2-Spalten-Layout)
const content = document.createElement("div");
content.className = "story-modal-content";
bodyEl.appendChild(content);

if (chapter.image) {
  const img = document.createElement("img");
  img.src = chapter.image;
  img.className = "story-modal-image";
  content.appendChild(img);
}

const textBlock = document.createElement("div");
textBlock.className = "story-text-block";
textBlock.textContent = chapter.text;
content.appendChild(textBlock);



    // Quests
    if (chapter.quests?.length > 0) {
      const qTitle = document.createElement("h4");
      qTitle.textContent = "Quests";
      bodyEl.appendChild(qTitle);

      const ul = document.createElement("ul");
      bodyEl.appendChild(ul);

      chapter.quests.forEach(q => {
        const li = document.createElement("li");
        const status = getQuestStatus(user.id, lang, story.id, q);

        li.innerHTML = `
          <span style="color:${status.done ? "#4caf50" : "#444"}">${q.label}</span>
          <span class="small" style="opacity:0.7;"> (${status.progressText})</span>
        `;

        ul.appendChild(li);
      });
    }

    // Kapitel als gelesen markieren
    markChapterRead(user.id, story.id, chapter.id);
    updateQuestProgress(user.id, "story", 1);
    setLastOpenedStory(story.id, chapter.id);

    // Navigation
    prevBtn.disabled = chapterIndex === 0;

    const hasNext = chapterIndex < total - 1;
    const nextUnlocked = hasNext
      ? isChapterUnlocked(user.id, lang, story.chapters[chapterIndex + 1])
      : false;

    nextBtn.disabled = hasNext && !nextUnlocked;
    nextBtn.textContent = hasNext
      ? (nextUnlocked ? "Weiterlesen →" : "Noch gesperrt")
      : "Schließen";

    prevBtn.onclick = () => openChapterModal(story, chapterIndex - 1);

    nextBtn.onclick = () => {
      if (!hasNext) {
        closeModal();
        return;
      }

      const nextChapter = story.chapters[chapterIndex + 1];
      if (!isChapterUnlocked(user.id, lang, nextChapter)) return;

      openChapterModal(story, chapterIndex + 1);
    };

    modal.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    bodyEl.scrollTop = 0;
  }
}
