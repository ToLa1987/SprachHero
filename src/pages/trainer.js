// =========================================================
// trainer.js – FINAL (ID-basiert + async + GitHubCSV)
// =========================================================

import {
  getGlobal,
  getWordsForLang,
  getCurrentUser,
  getUserWordState,
  setUserWordState,
  updateWordBoxState,
  addXpToHistory,
  updateStreak,
  addCompletedSession,
  getUserProgress,
  unlockBadge,
  updateLearningPath,
  getStreak,
  getActiveBoost
} from "../core/storage.js";

import { updateQuestProgress } from "../core/storage.js";
import { speak, getLangCodeForLanguage } from "../core/audio.js";
import { updateXpDisplay, computeDifficultyScore } from "../core/utils.js";
import { getLastOpenedStory } from "../story/storyEngine.js";
import { STORIES } from "../story/storyData.js";
import { XP } from "../core/xp.js";

// =========================================================
// Helpers
// =========================================================

function clean(v) {
  return (v || "").trim();
}

function computeXpChange(isCorrect, box, isSpeedMode) {
  if (isCorrect) {
    let base = 10;
    if (isSpeedMode) base += 5;
    return base;
  }

  const basePenaltyByBox = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  const extraSpeedPenalty = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 };

  return -(basePenaltyByBox[box] + (isSpeedMode ? extraSpeedPenalty[box] : 0));
}

function getDefaultWordState() {
  return {
    box: 1,
    ef: 2.5,
    interval: 0,
    repetitions: 0,
    nextDue: Date.now(),
    lastResult: null,
    lastTrainedAt: 0,
    timesSeen: 0,
    timesCorrect: 0,
    timesWrong: 0,
    avgResponseTime: 0,
    flag: null,
    xp: 0
  };
}

// =========================================================
// EXPORT: render (async)
// =========================================================

export async function render() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  app.innerHTML = "";

  const lang = getGlobal().language;
  const allWords = await getWordsForLang(lang) || [];

  if (!allWords.length) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = "<p>Keine Vokabeln vorhanden. Bitte zuerst CSV importieren.</p>";
    app.appendChild(card);
    return;
  }

  // =========================================================
  // Trainer-State (ID-basiert)
  // =========================================================

  let filteredIds = [];
  let currentWordId = null;
  let solutionShown = false;
  let speedTimer = null;
  let speedRemaining = 0;
  let sessionTimer = null;
  let sessionRemaining = 0;
  let sessionTotal = 0;
  let sessionActive = false;
  let sessionStartTime = 0;
  let sessionWords = 0;
  let sessionCorrect = 0;
  let sessionWrong = 0;
  let sessionXp = 0;

  // =========================================================
  // Info-Card
  // =========================================================

  const infoCard = document.createElement("div");
  infoCard.className = "card trainer-info-card";
  infoCard.innerHTML = `
    <h2>Trainer</h2>
    <p class="small">
      Aktive Sprache: <strong>${lang.toUpperCase()}</strong> ·
      Wörter im System: ${allWords.length} ·
      <span id="poolCountInfo">Wörter im Pool: 0</span>
    </p>
    <p class="small" id="trainerBoostInfo"></p>
  `;
  app.appendChild(infoCard);

  const poolCountInfoEl = infoCard.querySelector("#poolCountInfo");
  const trainerBoostInfo = infoCard.querySelector("#trainerBoostInfo");
  const activeBoost = getActiveBoost(user.id);

  if (activeBoost) {
    const secsLeft = Math.max(0, Math.floor((activeBoost.endsAt - Date.now()) / 1000));
    trainerBoostInfo.textContent = `🔥 XP-Boost aktiv: ${activeBoost.multiplier}× XP, noch ca. ${secsLeft}s`;
  } else {
    trainerBoostInfo.textContent = "Kein XP-Boost aktiv.";
  }

  // =========================================================
  // Filter-Card
  // =========================================================

  const filterCard = document.createElement("div");
  filterCard.className = "card trainer-filter-card";
  filterCard.innerHTML = `
    <div class="accordion">
      <div class="accordion-header">
        <span>Filter & Einstellungen</span>
        <span class="accordion-arrow">▼</span>
      </div>
      <div class="accordion-body">
        <label>Klasse:</label>
        <select id="filterClass"><option value="">Bitte wählen…</option></select>

        <div id="unitWrapper" style="display:none;">
          <label>Unit:</label>
          <select id="filterUnit"><option value="">Bitte wählen…</option></select>
        </div>

        <div id="subWrapper" style="display:none;">
          <label>Unterkapitel:</label>
          <select id="filterSub"><option value="">Bitte wählen…</option></select>
        </div>

        <div style="margin-top:10px;">
          <strong>Boxen:</strong><br>
          ${[1,2,3,4,5].map(b => `
            <label><input type="checkbox" class="filterBox" value="${b}"> Box ${b}</label>
          `).join("")}
        </div>

        <label style="margin-top:10px;">
          <input type="checkbox" id="filterShuffle"> Zufällige Reihenfolge
        </label>

        <label>Richtung:</label>
        <select id="directionSelect">
          <option value="de-fw">DE → ${lang.toUpperCase()}</option>
          <option value="fw-de">${lang.toUpperCase()} → DE</option>
        </select>

        <label>Modus:</label>
        <select id="modeSelect">
          <option value="oral">Mündlich</option>
          <option value="written">Schriftlich</option>
          <option value="mc">Multiple Choice</option>
        </select>

        <label>Timer-Modus:</label>
        <select id="timerModeSelect">
          <option value="none">Kein Timer</option>
          <option value="speed">Speed-Mode (10s)</option>
          <option value="session">Session-Mode</option>
        </select>

        <label id="sessionDurationLabel" style="display:none; margin-top:6px;">
          Session-Dauer:
          <select id="sessionDurationSelect">
            <option value="5">5 Minuten</option>
            <option value="10">10 Minuten</option>
            <option value="15">15 Minuten</option>
            <option value="20">20 Minuten</option>
            <option value="30">30 Minuten</option>
            <option value="45">45 Minuten</option>
            <option value="60">60 Minuten</option>
          </select>
        </label>

        <button id="applyTrainerFilter" class="big-primary-btn">Filter anwenden</button>
      </div>
    </div>
  `;
  app.appendChild(filterCard);

  const acc = filterCard.querySelector(".accordion");
  const accHeader = acc.querySelector(".accordion-header");
  const accBody = acc.querySelector(".accordion-body");

  accHeader.onclick = () => {
    const open = accBody.style.display === "block";
    accBody.style.display = open ? "none" : "block";
    accHeader.querySelector(".accordion-arrow").textContent = open ? "▶" : "▼";
  };

  const filterClassEl = accBody.querySelector("#filterClass");
  const filterUnitEl = accBody.querySelector("#filterUnit");
  const filterSubEl = accBody.querySelector("#filterSub");
  const unitWrapper = accBody.querySelector("#unitWrapper");
  const subWrapper = accBody.querySelector("#subWrapper");
  const filterShuffleEl = accBody.querySelector("#filterShuffle");
  const directionSelectEl = accBody.querySelector("#directionSelect");
  const modeSelectEl = accBody.querySelector("#modeSelect");
  const timerModeSelectEl = accBody.querySelector("#timerModeSelect");
  const sessionDurationLabelEl = accBody.querySelector("#sessionDurationLabel");
  const sessionDurationSelectEl = accBody.querySelector("#sessionDurationSelect");
  const applyBtn = accBody.querySelector("#applyTrainerFilter");

  const classes = [...new Set(allWords.map(w => clean(w.class)).filter(Boolean))]
    .sort((a,b) => Number(a) - Number(b));

  filterClassEl.innerHTML =
    `<option value="">Bitte wählen…</option>` +
    classes.map(c => `<option value="${c}">${c}</option>`).join("");

  function updateUnits() {
    const c = filterClassEl.value;

    if (!c) {
      unitWrapper.style.display = "none";
      subWrapper.style.display = "none";
      filterUnitEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      filterSubEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      return;
    }

    const units = [...new Set(
      allWords
        .filter(w => clean(w.class) === c)
        .map(w => clean(w.unit))
        .filter(Boolean)
    )].sort();

    filterUnitEl.innerHTML =
      `<option value="">Bitte wählen…</option>` +
      units.map(u => `<option value="${u}">${u}</option>`).join("");

    unitWrapper.style.display = "block";
    subWrapper.style.display = "none";
  }

  function updateSubs() {
    const c = filterClassEl.value;
    const u = filterUnitEl.value;

    if (!u) {
      subWrapper.style.display = "none";
      filterSubEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      return;
    }

    const subs = [...new Set(
      allWords
        .filter(w => clean(w.class) === c && clean(w.unit) === u)
        .map(w => clean(w.subcategory))
        .filter(Boolean)
    )].sort();

    filterSubEl.innerHTML =
      `<option value="">Bitte wählen…</option>` +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");

    subWrapper.style.display = "block";
  }

  filterClassEl.onchange = updateUnits;
  filterUnitEl.onchange = updateSubs;

  timerModeSelectEl.onchange = () => {
    sessionDurationLabelEl.style.display =
      timerModeSelectEl.value === "session" ? "block" : "none";
  };

  // =========================================================
  // Training-Card
  // =========================================================

  const card = document.createElement("div");
  card.className = "card trainer-main-card";
  card.innerHTML = `
    <div class="trainer-header-row">
      <h2>Training</h2>
      <div class="trainer-xp-top" id="trainerXpTop"></div>
    </div>

    <p class="small trainer-progress-info"></p>

    <button id="startSessionBtn" class="big-primary-btn">Session starten</button>

    <div class="trainer-table-wrapper">
      <table class="trainer-table learn-table">
        <thead>
          <tr>
            <th style="width:28%;">Vokabel</th>
            <th style="width:28%;">Übersetzung</th>
            <th style="width:34%;">Beispiel</th>
            <th style="width:10%;">Anhören</th>
          </tr>
        </thead>
        <tbody>
          <tr class="trainer-row">
            <td id="cellWord"></td>
            <td id="cellTranslation"></td>
            <td id="cellExample"></td>
            <td id="cellAudio"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <input type="text" class="trainer-input" placeholder="Antwort eingeben…">
    <div class="mc-container"></div>

    <div class="trainer-btn-block">
      <button class="btn-primary trainer-show-btn trainer-big-btn">Lösung anzeigen</button>
      <div class="trainer-small-btn-row">
        <button class="btn-secondary trainer-right-btn" disabled>Richtig</button>
        <button class="btn-secondary trainer-wrong-btn" disabled>Falsch</button>
        <button class="btn-secondary trainer-next-btn" disabled>Weiter</button>
      </div>
    </div>

    <p class="feedback"></p>
    <p class="xp-info"></p>

    <div class="trainer-timer-bar">
      <div class="trainer-timer-fill"></div>
    </div>

    <div class="trainer-session-bar">
      <div class="trainer-session-fill"></div>
    </div>

    <p class="small trainer-timer-text"></p>

    <div class="trainer-story-hint small"></div>

    <div class="trainer-box-progress">
      <h3>Box-Fortschritt</h3>
      <div class="trainer-box-bar"></div>
      <p class="small trainer-box-stats"></p>
      <p class="small trainer-vocab-stats"></p>
    </div>

    <div class="trainer-inspector small"></div>
  `;
  app.appendChild(card);

  const progressEl = card.querySelector(".trainer-progress-info");
  const sessionToggleBtn = card.querySelector("#startSessionBtn");
  const cellWord = card.querySelector("#cellWord");
  const cellTranslation = card.querySelector("#cellTranslation");
  const cellExample = card.querySelector("#cellExample");
  const cellAudio = card.querySelector("#cellAudio");
  const inputEl = card.querySelector(".trainer-input");
  const mcContainer = card.querySelector(".mc-container");
  const showBtn = card.querySelector(".trainer-show-btn");
  const rightBtn = card.querySelector(".trainer-right-btn");
  const wrongBtn = card.querySelector(".trainer-wrong-btn");
  const nextBtn = card.querySelector(".trainer-next-btn");
  const feedbackEl = card.querySelector(".feedback");
  const xpInfoEl = card.querySelector(".xp-info");
  const timerBarContainer = card.querySelector(".trainer-timer-bar");
  const timerBarFill = card.querySelector(".trainer-timer-fill");
  const sessionBar = card.querySelector(".trainer-session-bar");
  const sessionFill = card.querySelector(".trainer-session-fill");
  const timerTextEl = card.querySelector(".trainer-timer-text");
  const storyHint = card.querySelector(".trainer-story-hint");
  const boxProgressBar = card.querySelector(".trainer-box-bar");
  const boxStatsEl = card.querySelector(".trainer-box-stats");
  const vocabStatsEl = card.querySelector(".trainer-vocab-stats");
  const inspector = card.querySelector(".trainer-inspector");

  const audioBtn = document.createElement("button");
  audioBtn.className = "btn-secondary";
  audioBtn.textContent = "🔊";
  audioBtn.disabled = true;
  cellAudio.appendChild(audioBtn);

  const xpPopupEl = document.createElement("div");
  xpPopupEl.className = "trainer-xp-popup";
  card.appendChild(xpPopupEl);

  sessionFill.style.width = "0%";
  sessionBar.style.display = "none";
  // =========================================================
  // Timer-Helfer
  // =========================================================

  function clearTimers() {
    if (speedTimer) {
      clearInterval(speedTimer);
      speedTimer = null;
    }
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }

    timerBarContainer.style.display = "none";
    timerBarFill.style.width = "0%";

    if (timerModeSelectEl.value !== "session") {
      sessionBar.style.display = "none";
      sessionFill.style.width = "0%";
    }

    timerTextEl.textContent = "";
  }

  function startSpeedTimer() {
    speedRemaining = 10;
    timerBarContainer.style.display = "block";
    timerTextEl.textContent = `Speed: ${speedRemaining}s`;
    timerBarFill.style.width = "100%";

    if (speedTimer) clearInterval(speedTimer);
    const total = speedRemaining;

    speedTimer = setInterval(() => {
      speedRemaining--;

      if (speedRemaining <= 0) {
        clearInterval(speedTimer);
        speedTimer = null;
        timerBarFill.style.width = "0%";
        timerTextEl.textContent = "Zeit abgelaufen.";

        if (!solutionShown) {
          showSolution();
          handleResult(false);
          showBtn.textContent = "Weiter";
          showBtn.disabled = false;
          showBtn.onclick = () => showWord();
          rightBtn.disabled = true;
          wrongBtn.disabled = true;
        }
        return;
      }

      timerTextEl.textContent = `Speed: ${speedRemaining}s`;
      timerBarFill.style.width = `${(speedRemaining / total) * 100}%`;
    }, 1000);
  }

  function startSessionTimer() {
    const minutes = Number(sessionDurationSelectEl.value || "0");
    if (!minutes) return;

    sessionTotal = minutes * 60;
    sessionRemaining = sessionTotal;

    timerBarContainer.style.display = "block";
    sessionBar.style.display = "block";
    timerTextEl.textContent = `Session: ${minutes} min`;
    timerBarFill.style.width = "100%";

    if (sessionTimer) clearInterval(sessionTimer);

    sessionTimer = setInterval(() => {
      sessionRemaining--;

      if (sessionRemaining <= 0) {
        clearInterval(sessionTimer);
        sessionTimer = null;
        timerBarFill.style.width = "0%";
        sessionFill.style.width = "0%";
        timerTextEl.textContent = "Session-Zeit abgelaufen.";
        endSession();
        return;
      }

      const mins = Math.floor(sessionRemaining / 60);
      const secs = sessionRemaining % 60;
      timerTextEl.textContent = `Session: ${mins}:${secs.toString().padStart(2, "0")}`;
      timerBarFill.style.width = `${(sessionRemaining / sessionTotal) * 100}%`;

      const progress = (sessionRemaining / sessionTotal) * 100;
      sessionFill.style.width = progress + "%";

      if (progress > 60) sessionFill.style.background = "#4caf50";
      else if (progress > 30) sessionFill.style.background = "#fbc02d";
      else sessionFill.style.background = "#e53935";
    }, 1000);
  }

  function updateSessionTimerUI() {
    if (!sessionTotal || !sessionRemaining) return;
    const mins = Math.floor(sessionRemaining / 60);
    const secs = sessionRemaining % 60;
    timerTextEl.textContent = `Session: ${mins}:${secs.toString().padStart(2, "0")}`;
    timerBarFill.style.width = `${(sessionRemaining / sessionTotal) * 100}%`;
  }

  // =========================================================
  // Box-Progress
  // =========================================================

  function updateBoxProgress() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    filteredIds.forEach(id => {
      const state = getUserWordState(user.id, lang, id) || {};
      const b = state.box || 1;
      counts[b]++;
    });

    const total = filteredIds.length || 1;
    boxProgressBar.innerHTML = "";

    const colors = {
      1: "#e53935",
      2: "#fb8c00",
      3: "#fdd835",
      4: "#43a047",
      5: "#1e88e5"
    };

    [1,2,3,4,5].forEach(b => {
      const seg = document.createElement("div");
      seg.style.width = (counts[b] / total * 100) + "%";
      seg.style.background = colors[b];
      boxProgressBar.appendChild(seg);
    });

    boxStatsEl.textContent =
      `Box 1: ${counts[1]} · Box 2: ${counts[2]} · Box 3: ${counts[3]} · Box 4: ${counts[4]} · Box 5: ${counts[5]}`;
  }

  // =========================================================
  // Filter anwenden
  // =========================================================

  function applyFiltersNow() {
    const classVal = clean(filterClassEl.value);
    const unitVal = clean(filterUnitEl.value);
    const subVal = clean(filterSubEl.value);
    const shuffle = filterShuffleEl.checked;

    const selectedBoxes = [...accBody.querySelectorAll(".filterBox:checked")]
      .map(cb => Number(cb.value));

    filteredIds = allWords
      .filter(w => {
        if (classVal && clean(w.class) !== classVal) return false;
        if (unitVal && clean(w.unit) !== unitVal) return false;
        if (subVal && clean(w.subcategory) !== subVal) return false;

        if (selectedBoxes.length > 0) {
          const state = getUserWordState(user.id, lang, w.id) || {};
          if (!selectedBoxes.includes(state.box || 1)) return false;
        }

        return true;
      })
      .map(w => w.id);

    if (shuffle) filteredIds.sort(() => Math.random() - 0.5);

    poolCountInfoEl.textContent = `Wörter im Pool: ${filteredIds.length}`;
    progressEl.textContent = `Wörter im Pool: ${filteredIds.length}`;

    clearTimers();

    if (!sessionActive) {
      cellWord.textContent = "Session noch nicht gestartet.";
      cellTranslation.textContent = "";
      cellExample.textContent = "";
      disableAll();
    }

    updateBoxProgress();

    accBody.style.display = "none";
    accHeader.querySelector(".accordion-arrow").textContent = "▶";
  }

  if (applyBtn) {
    applyBtn.onclick = applyFiltersNow;
  }

  // =========================================================
  // Filter-Übernahme aus Lernen / Lernpfad
  // =========================================================

  const preClass = localStorage.getItem("trainerFilterClass") || "";
  const preUnit = localStorage.getItem("trainerFilterUnit") || "";
  const preSub = localStorage.getItem("trainerFilterSub") || "";

  if (preClass || preUnit || preSub) {
    if (preClass) {
      filterClassEl.value = preClass;
      updateUnits();
    }
    if (preUnit) {
      filterUnitEl.value = preUnit;
      updateSubs();
    }
    if (preSub) {
      filterSubEl.value = preSub;
    }

    applyFiltersNow();

    accBody.style.display = "none";
    accHeader.querySelector(".accordion-arrow").textContent = "▶";

    localStorage.removeItem("trainerFilterClass");
    localStorage.removeItem("trainerFilterUnit");
    localStorage.removeItem("trainerFilterSub");
  } else {
    applyFiltersNow();
  }

  // =========================================================
  // Wortauswahl & Anzeige
  // =========================================================

  function disableAll() {
    inputEl.disabled = true;
    showBtn.disabled = true;
    rightBtn.disabled = true;
    wrongBtn.disabled = true;
    nextBtn.disabled = true;
    mcContainer.querySelectorAll("button").forEach(b => b.disabled = true);
  }

  function pickAdaptiveWord() {
    const now = Date.now();

    const due = filteredIds.filter(id => {
      const s = getUserWordState(user.id, lang, id);
      return !s || typeof s.nextDue !== "number" || s.nextDue <= now;
    });

    if (due.length > 0) {
      const scored = due.map(id => {
        const state = getUserWordState(user.id, lang, id) || {};
        const score = computeDifficultyScore(state);
        return { id, score };
      });

      const maxScore = Math.max(...scored.map(s => s.score));
      const top = scored.filter(s => s.score === maxScore);
      return top[Math.floor(Math.random() * top.length)].id;
    }

    let nextId = filteredIds[0];
    let nextTime = Infinity;

    filteredIds.forEach(id => {
      const s = getUserWordState(user.id, lang, id) || {};
      const nd = typeof s.nextDue === "number" ? s.nextDue : Infinity;
      if (nd < nextTime) {
        nextTime = nd;
        nextId = id;
      }
    });

    return nextId;
  }

  function showWord() {
    const mode = modeSelectEl.value;

    if (!sessionActive) {
      cellWord.textContent = "Session noch nicht gestartet.";
      cellTranslation.textContent = "";
      cellExample.textContent = "";
      disableAll();
      return;
    }

    if (!filteredIds.length) {
      cellWord.textContent = "Keine Wörter entsprechen den Filtern.";
      cellTranslation.textContent = "";
      cellExample.textContent = "";
      disableAll();
      return;
    }

    currentWordId = pickAdaptiveWord();
    const w = allWords.find(x => x.id === currentWordId);

    let state = getUserWordState(user.id, lang, currentWordId);
    if (!state) state = getDefaultWordState();

    state.timesSeen = (state.timesSeen || 0) + 1;
    setUserWordState(user.id, lang, currentWordId, state);

    const direction = directionSelectEl.value;
    const questionText =
      direction === "de-fw" ? (w.translation || "") : (w.word || "");

    const diffScore = computeDifficultyScore(state);

    if (diffScore >= 6) {
      cellWord.innerHTML = `${questionText} <span class="trainer-warning">⚠️</span>`;
    } else {
      cellWord.textContent = questionText;
    }

    cellTranslation.textContent = "";
    cellExample.textContent = "";
    inputEl.value = "";
    feedbackEl.textContent = "";
    solutionShown = false;
    mcContainer.innerHTML = "";
    audioBtn.disabled = true;

    if (mode === "oral") {
      inputEl.style.display = "none";
      showBtn.disabled = false;
      rightBtn.disabled = true;
      wrongBtn.disabled = true;
      nextBtn.style.display = "none";
    }

    if (mode === "written") {
      inputEl.style.display = "block";
      inputEl.disabled = false;
      showBtn.disabled = false;
      nextBtn.style.display = "inline-block";
      nextBtn.disabled = true;
      rightBtn.style.display = "none";
      wrongBtn.style.display = "none";
    }

    if (mode === "mc") {
      inputEl.style.display = "none";
      rightBtn.style.display = "none";
      wrongBtn.style.display = "none";
      nextBtn.style.display = "none";
      buildMultipleChoice(w, direction);
    }

    progressEl.textContent = `Wörter im Pool: ${filteredIds.length}`;

    if (timerModeSelectEl.value === "speed") {
      clearTimers();
      startSpeedTimer();
    } else if (timerModeSelectEl.value === "session") {
      if (!sessionTimer && sessionTotal > 0) {
        startSessionTimer();
      } else if (sessionTimer) {
        updateSessionTimerUI();
      }
    } else {
      clearTimers();
    }
  }

  function buildMultipleChoice(word, direction) {
    const correct =
      direction === "de-fw" ? word.word : word.translation;

    const candidates = allWords
      .filter(w =>
        (direction === "de-fw" ? w.word : w.translation) &&
        (direction === "de-fw" ? w.word : w.translation) !== correct
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [
      correct,
      ...candidates.map(w => direction === "de-fw" ? w.word : w.translation)
    ].sort(() => Math.random() - 0.5);

    mcContainer.innerHTML = "";
    mcContainer.style.display = "grid";

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.className = "btn-secondary";
      btn.onclick = () => {
        const isCorrect = opt === correct;
        showSolution();
        handleResult(isCorrect);
        setTimeout(() => showWord(), 800);
      };
      mcContainer.appendChild(btn);
    });
  }

  function speakWordAndExample(w) {
    const langCode = getLangCodeForLanguage(lang);
    const text = w.word || "";
    const delay = Math.max(1200, text.length * 80);

    speak(text, langCode);

    if (w.example) {
      setTimeout(() => speak(w.example, langCode), delay);
    }
  }

  audioBtn.onclick = () => {
    if (!solutionShown || !currentWordId) return;
    const w = allWords.find(x => x.id === currentWordId);
    if (!w) return;
    speakWordAndExample(w);
  };

  function showSolution() {
    if (solutionShown || !currentWordId) return;

    const w = allWords.find(x => x.id === currentWordId);
    if (!w) return;

    const direction = directionSelectEl.value;
    const solutionWord =
      direction === "de-fw" ? w.word : w.translation;

    cellTranslation.textContent = solutionWord || "";
    cellExample.textContent = w.example || "";
    cellTranslation.classList.add("fade-in");
    cellExample.classList.add("fade-in");
    audioBtn.disabled = false;
    speakWordAndExample(w);

    const mode = modeSelectEl.value;

    if (mode === "oral") {
      rightBtn.disabled = false;
      wrongBtn.disabled = false;
      rightBtn.style.display = "inline-block";
      wrongBtn.style.display = "inline-block";
    }

    if (mode === "written") {
      const userAnswer = clean(inputEl.value).toLowerCase();
      const correctAnswer = clean(solutionWord).toLowerCase();
      const isCorrect = userAnswer && userAnswer === correctAnswer;
      handleResult(isCorrect);
      nextBtn.disabled = false;
    }

    solutionShown = true;
  }

  // =========================================================
  // Ergebnis / SM2 / XP
  // =========================================================

  function handleResult(isCorrect) {
    if (!currentWordId) return;

    const now = Date.now();
    let state = getUserWordState(user.id, lang, currentWordId);

    if (!state) state = getDefaultWordState();

    if (typeof state.timesSeen !== "number") state.timesSeen = 0;
    if (typeof state.timesCorrect !== "number") state.timesCorrect = 0;
    if (typeof state.timesWrong !== "number") state.timesWrong = 0;
    if (typeof state.avgResponseTime !== "number") state.avgResponseTime = 0;
    if (typeof state.lastTrainedAt !== "number") state.lastTrainedAt = 0;
    if (typeof state.flag === "undefined") state.flag = null;
    if (typeof state.ef !== "number") state.ef = 2.5;
    if (typeof state.interval !== "number") state.interval = 0;
    if (typeof state.repetitions !== "number") state.repetitions = 0;
    if (typeof state.nextDue !== "number") state.nextDue = now;

    let responseTime = 0;
    if (state.lastTrainedAt > 0) {
      responseTime = now - state.lastTrainedAt;
    }

    state.timesSeen++;

    if (isCorrect) {
      state.timesCorrect++;
      updateQuestProgress(user.id, "words", 1);
    } else {
      state.timesWrong++;
    }

    if (responseTime > 0) {
      state.avgResponseTime = Math.round(
        (state.avgResponseTime * (state.timesSeen - 1) + responseTime) / state.timesSeen
      );
    }

    state.lastTrainedAt = now;

    const currentBox = state.box || 1;
    const isSpeedMode = timerModeSelectEl.value === "speed";

    updateWordBoxState(state, isCorrect);

    const quality = isCorrect ? 4 : 2;

    if (quality < 3) {
      state.repetitions = 0;
      state.interval = 0;
      state.nextDue = now;
      state.ef = Math.max(1.3, state.ef - 0.2);
    } else {
      if (state.repetitions === 0) {
        state.interval = 60;
      } else if (state.repetitions === 1) {
        state.interval = 600;
      } else {
        state.interval = Math.round(state.interval * state.ef);
      }

      state.repetitions++;
      state.ef =
        state.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (state.ef < 1.3) state.ef = 1.3;
      state.nextDue = now + state.interval * 1000;
    }

    const xpChange = computeXpChange(isCorrect, currentBox, isSpeedMode);
    state.xp = Math.max(0, (state.xp || 0) + xpChange);

    XP.addXP(user.id, xpChange);
    updateQuestProgress(user.id, "xp", xpChange);
    setUserWordState(user.id, lang, currentWordId, state);
    addXpToHistory(user.id, xpChange);
    updateStreak(user.id, isCorrect);

    if (sessionActive) {
      sessionWords++;
      sessionXp += xpChange;
      if (isCorrect) sessionCorrect++;
      else sessionWrong++;
    }

    const xpTop = document.getElementById("trainerXpTop");
    if (xpTop) {
      xpTop.style.opacity = "1";
      xpTop.style.color = isCorrect ? "#2ecc71" : "#e74c3c";
      xpTop.textContent = isCorrect
        ? `✓ Richtig · XP +${xpChange}`
        : `✗ Falsch · XP ${xpChange}`;
      setTimeout(() => {
        xpTop.style.opacity = "0";
      }, 1500);
    }

    updateXpDisplay();
    updateBoxProgress();

    if (timerModeSelectEl.value !== "session") {
      clearTimers();
    }

    const progress = getUserProgress(user.id) || {};
    const totalXp = progress.totalXp || 0;

    if (totalXp >= 100) unlockBadge(user.id, "first100");

    const streak = getStreak(user.id);
    if (streak.current >= 5) unlockBadge(user.id, "streak5");
  }

  // =========================================================
  // Session-Logik
  // =========================================================

  function resetSessionStats() {
    sessionWords = 0;
    sessionCorrect = 0;
    sessionWrong = 0;
    sessionXp = 0;
  }

  function startSession() {
    if (!filteredIds.length) {
      feedbackEl.className = "feedback info";
      feedbackEl.textContent = "Bitte zuerst Filter anwenden, damit Wörter im Pool sind.";
      return;
    }

    sessionActive = true;
    sessionStartTime = Date.now();
    resetSessionStats();

    sessionFill.style.width = "0%";
    sessionFill.style.background = "#4caf50";
    sessionBar.style.display = "block";
    sessionToggleBtn.textContent = "Session beenden";

    feedbackEl.className = "feedback info";
    feedbackEl.textContent = "Session gestartet.";

    showWord();

    if (timerModeSelectEl.value === "session") {
      startSessionTimer();
    }
  }

  function endSession() {
    if (!sessionActive) return;

    poolCountInfoEl.textContent = `Wörter im Pool: ${filteredIds.length}`;
    sessionActive = false;

    const seconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));

    addCompletedSession(user.id, {
      seconds,
      xp: sessionXp,
      words: sessionWords,
      correct: sessionCorrect,
      wrong: sessionWrong
    });

    updateQuestProgress(user.id, "session", 1);

    const stats = computeLearningPathStats();
    updateLearningPath(user.id, stats);

    sessionToggleBtn.textContent = "Session starten";
    feedbackEl.className = "feedback info";
    feedbackEl.textContent = "Session gespeichert.";

    clearTimers();
    sessionBar.style.display = "none";
    sessionFill.style.width = "0%";

    cellWord.textContent = "Session beendet.";
    cellTranslation.textContent = "";
    cellExample.textContent = "";
    disableAll();
  }

  sessionToggleBtn.onclick = () => {
    if (!sessionActive) startSession();
    else endSession();
  };

  // =========================================================
  // Events
  // =========================================================

  showBtn.onclick = () => {
    const mode = modeSelectEl.value;
    if (mode === "oral" || mode === "written") showSolution();
  };

  rightBtn.onclick = () => {
    handleResult(true);
    setTimeout(() => showWord(), 600);
  };

  wrongBtn.onclick = () => {
    handleResult(false);
    setTimeout(() => showWord(), 600);
  };

  nextBtn.onclick = () => {
    showWord();
  };

  inputEl.addEventListener("keydown", e => {
    if (modeSelectEl.value === "written" && e.key === "Enter") {
      if (!solutionShown) showSolution();
      else showWord();
    }
  });

  // =========================================================
  // Story-Hinweis
  // =========================================================

  function updateStoryHint() {
    const last = getLastOpenedStory();

    if (!last) {
      storyHint.style.display = "none";
      return;
    }

    const story = STORIES.find(s => s.id === last.storyId);
    if (!story) {
      storyHint.style.display = "none";
      return;
    }

    const chapter = story.chapters.find(c => c.id === last.chapterId);
    if (!chapter) {
      storyHint.style.display = "none";
      return;
    }

    storyHint.innerHTML = `
      Letztes Story-Kapitel: <strong>${story.title}</strong> – ${chapter.title}
    `;
    storyHint.style.display = "block";
  }

  updateStoryHint();

  // =========================================================
  // Lernpfad-Analyse
  // =========================================================

  function computeLearningPathStats() {
    const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const unitStats = {};

    allWords.forEach(w => {
      const s = getUserWordState(user.id, lang, w.id) || {};
      const b = s.box || 1;
      boxCounts[b]++;

      const unitKey = `${clean(w.class)}|${clean(w.unit)}`;
      if (!unitStats[unitKey]) {
        unitStats[unitKey] = { total: 0, low: 0 };
      }

      unitStats[unitKey].total++;
      if (b <= 2) unitStats[unitKey].low++;
    });

    let weakestBox = 1;
    let maxLow = -1;

    [1,2,3,4,5].forEach(b => {
      if (boxCounts[b] > maxLow) {
        maxLow = boxCounts[b];
        weakestBox = b;
      }
    });

    let weakestUnit = null;
    let weakestScore = -1;

    Object.entries(unitStats).forEach(([key, val]) => {
      if (val.low > weakestScore) {
        weakestScore = val.low;
        weakestUnit = key;
      }
    });

    let recommendedSession = "";

    if (weakestUnit) {
      const [cls, unit] = weakestUnit.split("|");
      recommendedSession = `Klasse ${cls}, Unit ${unit}`;
    } else {
      recommendedSession = "Allgemeines Training";
    }

    return {
      weakestBox,
      weakestUnit: weakestUnit || "-",
      recommendedSession
    };
  }

  // =========================================================
  // Debug-Tools
  // =========================================================

  window.shUser = user;
  window.shLang = lang;
  window.shWords = allWords;
  window.shState = id => getUserWordState(user.id, lang, id);
  window.shSetState = (id, newState) => {
    setUserWordState(user.id, lang, id, newState);
  };
  window.shResetState = id => {
    setUserWordState(user.id, lang, id, null);
  };
  window.shInitSM2 = id => {
    setUserWordState(user.id, lang, id, getDefaultWordState());
  };
  window.shShowInspector = id => {
    const s = getUserWordState(user.id, lang, id) || getDefaultWordState();
    inspector.innerHTML = `
      <strong>SM-2 Inspector</strong><br>
      EF: ${s.ef}<br>
      Interval: ${s.interval}s<br>
      Repetitions: ${s.repetitions}<br>
      Next Due: ${new Date(s.nextDue).toLocaleString()}<br>
      Difficulty: ${computeDifficultyScore(s)} / 10<br>
      Box: ${s.box}
    `;
    inspector.style.display = "block";
  };
}
