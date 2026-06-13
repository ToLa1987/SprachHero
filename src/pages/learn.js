// ===============================
// LERNMODUS – V38 (FINAL)
// ===============================

import {
  getCurrentUser,
  getGlobal,
  getWordsForLang,
  getUserWordState,
  getLearningPath
} from "../core/storage.js";

import {
  speakAsync,
  getLangCodeForLanguage
} from "../core/audio.js";

let speechRate = 1.0;
let globalAudioAbort = null;
let autoRunning = false;

// TAB-WECHSEL: Autoplay & Audio stoppen (global)
function stopLearningMode() {
  autoRunning = false;
  syncGlobals();
  if (globalAudioAbort) globalAudioAbort();
  window.speechSynthesis.cancel();
  window.currentLearnSessionId = "stopped_" + Math.random();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    autoRunning = false;
    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();
  }
});

window.globalAudioAbort = globalAudioAbort;
window.autoRunning = autoRunning;

export async function render() {
    window.currentLearnSessionId = Symbol("learnSession");
  const sessionId = window.currentLearnSessionId;

  if (window.globalAudioAbort) window.globalAudioAbort();
  window.speechSynthesis.cancel();
  window.autoRunning = false;

  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  app.innerHTML = "";

  const g = getGlobal();
  const lang = g.language;

const allWords = await getWordsForLang(lang);
  const langDE = getLangCodeForLanguage("de");
  const langFW = getLangCodeForLanguage(lang);
  const learningPath = getLearningPath(user.id);

  const storedRate = Number(localStorage.getItem("learn_speech_rate") || "0");

  if (!storedRate) {
    if (lang === "en") speechRate = 0.95;
    else if (lang === "fr") speechRate = 0.90;
    else if (lang === "es") speechRate = 0.95;
    else if (lang === "it") speechRate = 1.00;
    else if (lang === "de") speechRate = 1.00;
    else if (lang === "tr") speechRate = 0.95;
    else if (lang === "pl") speechRate = 0.90;
    else speechRate = 1.0;
  } else if (!isNaN(storedRate) && storedRate >= 0.6 && storedRate <= 1.4) {
    speechRate = storedRate;
  }

  function syncGlobals() {
    window.globalAudioAbort = globalAudioAbort;
    window.autoRunning = autoRunning;
  }

  syncGlobals();

  // ===============================
  // STICKY WRAPPER
  // ===============================

  const stickyWrapper = document.createElement("div");
  stickyWrapper.className = "learn-sticky-wrapper";
  app.appendChild(stickyWrapper);

  // ===============================
  // HEADER
  // ===============================

  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <h2>📚 Lernen</h2>
    <p class="small">Lerne Vokabeln Schritt für Schritt – mit oder ohne AutoPlay.</p>
  `;
  stickyWrapper.appendChild(header);

  // ===============================
  // FILTERCARD
  // ===============================

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
        <select id="learnClass"><option value="">Bitte wählen…</option></select>

        <div id="learnUnitWrapper" style="display:none;">
          <label>Kapitel:</label>
          <select id="learnUnit"><option value="">Bitte wählen…</option></select>
        </div>

        <div id="learnSubWrapper" style="display:none;">
          <label>Lektion:</label>
          <select id="learnSub"><option value="">Bitte wählen…</option></select>
        </div>

        <div style="margin-top:10px;">
          <strong>Boxen:</strong><br>
          <label class="filter-box-label"><input type="checkbox" class="learnBoxFilter" value="1"> ⭐ Box 1 – Neue Wörter / Fehler</label>
          <label class="filter-box-label"><input type="checkbox" class="learnBoxFilter" value="2"> 🔁 Box 2 – Erste Wiederholung</label>
          <label class="filter-box-label"><input type="checkbox" class="learnBoxFilter" value="3"> 🔵 Box 3 – Mittlere Sicherheit</label>
          <label class="filter-box-label"><input type="checkbox" class="learnBoxFilter" value="4"> 🟢 Box 4 – Gute Sicherheit</label>
          <label class="filter-box-label"><input type="checkbox" class="learnBoxFilter" value="5"> 🟣 Box 5 – Sehr sicher / selten abfragen</label>
        </div>

        <label style="margin-top:10px;"><input type="checkbox" id="learnOnlyErrors"> Nur Wörter wiederholen, die im Trainer falsch waren</label>

        <label>Richtung:</label>
        <select id="learnDirection">
          <option value="de-en">Deutsch → Fremdsprache</option>
          <option value="en-de">Fremdsprache → Deutsch</option>
        </select>

        <label>AutoPlay:</label>
        <select id="learnAutoplay">
          <option value="off">Aus</option>
          <option value="on">An</option>
        </select>

        <div id="displayWrapper">
          <label>Anzeige-Modus:</label>
          <select id="learnDisplay">
            <option value="single">Einzeln</option>
            <option value="all">Alle anzeigen</option>
          </select>
        </div>

        <label>Sprechgeschwindigkeit:</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="range" id="speechRate" min="0.6" max="1.4" step="0.1" value="${speechRate.toFixed(1)}">
          <span id="speechRateLabel">${speechRate.toFixed(1)}x</span>
        </div>

        <div style="margin-top:10px; padding-top:8px; border-top:1px solid #ddd;">
          <strong>Erweiterte Optionen:</strong><br>
          <label style="display:block; margin-top:4px;"><input type="checkbox" id="learnShuffle"> Zufällige Reihenfolge</label>
          <label style="display:block; margin-top:4px;"><input type="checkbox" id="learnAutoExample" checked> Beispielsatz anzeigen & vorlesen</label>
        </div>

        <button id="applyLearnFilters" class="big-primary-btn">Filter anwenden</button>
        <button id="applyLearningPath" class="big-primary-btn">Lernpfad laden</button>

      </div>
    </div>
  `;
  stickyWrapper.appendChild(filterCard);

  // ===============================
  // FILTERCARD LOGIK
  // ===============================

  const acc = filterCard.querySelector(".accordion");
  const accHeader = acc.querySelector(".accordion-header");
  const accBody = acc.querySelector(".accordion-body");

  accHeader.style.cursor = "pointer";
  accHeader.onclick = () => {
    const open = accBody.style.display === "block";
    accBody.style.display = open ? "none" : "block";
    accHeader.querySelector(".accordion-arrow").textContent = open ? "▶" : "▼";
  };

  const classEl = filterCard.querySelector("#learnClass");
  const unitEl = filterCard.querySelector("#learnUnit");
  const subEl = filterCard.querySelector("#learnSub");

  const unitWrapper = filterCard.querySelector("#learnUnitWrapper");
  const subWrapper = filterCard.querySelector("#learnSubWrapper");

  const boxCheckboxes = filterCard.querySelectorAll(".learnBoxFilter");
  const onlyErrorsEl = filterCard.querySelector("#learnOnlyErrors");
  const directionEl = filterCard.querySelector("#learnDirection");
  const autoplayEl = filterCard.querySelector("#learnAutoplay");
  const displayEl = filterCard.querySelector("#learnDisplay");
  const displayWrapper = filterCard.querySelector("#displayWrapper");

  const speechRateInput = filterCard.querySelector("#speechRate");
  const speechRateLabel = filterCard.querySelector("#speechRateLabel");

  const shuffleEl = filterCard.querySelector("#learnShuffle");
  const autoExampleEl = filterCard.querySelector("#learnAutoExample");

  const applyFiltersBtn = filterCard.querySelector("#applyLearnFilters");
  const applyLearningPathBtn = filterCard.querySelector("#applyLearningPath");

  speechRateInput.oninput = () => {
    speechRate = parseFloat(speechRateInput.value);
    speechRateLabel.textContent = `${speechRate.toFixed(1)}x`;
    localStorage.setItem("learn_speech_rate", String(speechRate));
  };

  const classes = [...new Set(allWords.map(w => w.class).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));

  classEl.innerHTML = `<option value="">Bitte wählen…</option>` +
    classes.map(c => `<option value="${c}">${c}</option>`).join("");

  function updateUnits() {
    const c = classEl.value;

    if (!c) {
      unitWrapper.style.display = "none";
      subWrapper.style.display = "none";
      unitEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      subEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      return;
    }

    const units = [...new Set(
      allWords.filter(w => w.class === c).map(w => w.unit).filter(Boolean)
    )].sort();

    unitEl.innerHTML = `<option value="">Bitte wählen…</option>` +
      units.map(u => `<option value="${u}">${u}</option>`).join("");

    unitWrapper.style.display = "block";
    subWrapper.style.display = "none";
  }

  function updateSubs() {
    const c = classEl.value;
    const u = unitEl.value;

    if (!u) {
      subWrapper.style.display = "none";
      subEl.innerHTML = `<option value="">Bitte wählen…</option>`;
      return;
    }

    const subs = [...new Set(
      allWords.filter(w => w.class === c && w.unit === u)
        .map(w => w.subcategory).filter(Boolean)
    )].sort();

    subEl.innerHTML = `<option value="">Bitte wählen…</option>` +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");

    subWrapper.style.display = "block";
  }

  classEl.onchange = updateUnits;
  unitEl.onchange = updateSubs;

  displayWrapper.style.display = autoplayEl.value === "on" ? "block" : "none";

  autoplayEl.onchange = () => {
    const isAuto = autoplayEl.value === "on";
    displayWrapper.style.display = isAuto ? "block" : "none";
  };

  // ===============================
  // TOP-BAR
  // ===============================

  const topBar = document.createElement("div");
  topBar.className = "learn-topbar";
  filterCard.after(topBar);

  topBar.innerHTML = `
    <div class="learn-progress-wrapper">
      <div class="learn-progress-text"></div>
      <div class="learn-progress-bar">
        <div class="learn-progress-bar-inner"></div>
      </div>
    </div>

    <div class="learn-controls">
      <button id="learnBack" class="btn-secondary">← Zurück</button>
      <button id="learnToggle" class="btn-primary">Start</button>
    </div>
  `;

  const progressTextEl = topBar.querySelector(".learn-progress-text");
  const progressBarInner = topBar.querySelector(".learn-progress-bar-inner");
  const backBtn = topBar.querySelector("#learnBack");
  const toggleBtn = topBar.querySelector("#learnToggle");

  // ===============================
  // TABELLE-CARD
  // ===============================

  const tableCard = document.createElement("div");
  tableCard.className = "card learn-table-card";

  tableCard.innerHTML = `
    <table class="learn-table">
      <thead>
        <tr>
          <th>Vokabel</th>
          <th>Übersetzung</th>
          <th>Beispiel</th>
          <th></th>
        </tr>
      </thead>
      <tbody class="learn-tbody"></tbody>
    </table>
  `;

  app.appendChild(tableCard);

  const tbody = tableCard.querySelector(".learn-tbody");

  // ===============================
  // STATE
  // ===============================

  let filtered = [];
  let learnedFlags = [];
  let activeIndex = 0;
  let rows = [];
  let isManualPlaying = false;
  let shuffleEnabled = false;
  let autoExampleEnabled = true;
  let onlyErrorsEnabled = false;

  const STORAGE_KEY = `learn_state_${user.id}_${lang}`;

    // ===============================
  // LERNPFAD-FILTER (V38 FIX)
  // ===============================

  let words = allWords;

  const lpClass = localStorage.getItem("learnFilterClass");
  const lpUnit = localStorage.getItem("learnFilterUnit");
  const lpSub = localStorage.getItem("learnFilterSub");

  if (lpClass || lpUnit || lpSub) {
    words = words.filter(w =>
      (!lpClass || w.class === lpClass) &&
      (!lpUnit || w.unit === lpUnit) &&
      (!lpSub || w.subcategory === lpSub)
    );

    localStorage.removeItem("learnFilterClass");
    localStorage.removeItem("learnFilterUnit");
    localStorage.removeItem("learnFilterSub");
  }

  // ===============================
  // FILTER ANWENDEN
  // ===============================

  function applyFilters() {
    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    autoRunning = false;
    syncGlobals();

    const c = classEl.value;
    const u = unitEl.value;
    const s = subEl.value;

    const selectedBoxes = [...boxCheckboxes]
      .filter(cb => cb.checked)
      .map(cb => Number(cb.value));

    shuffleEnabled = shuffleEl.checked;
    autoExampleEnabled = autoExampleEl.checked;
    onlyErrorsEnabled = onlyErrorsEl.checked;

    const mode = getMode();
    toggleBtn.textContent = mode === "manual" ? "Start" : "Start";

    filtered = filterWords(c, u, s, selectedBoxes, onlyErrorsEnabled);

    if (shuffleEnabled && filtered.length > 0) {
      shuffleArray(filtered);
    }

    activeIndex = 0;
    learnedFlags = filtered.map(() => false);

    finishedCard.style.display = "none";
    tableCard.style.display = "block";

    accBody.style.display = "none";
    accHeader.querySelector(".accordion-arrow").textContent = "▶";

    buildTable();
    updateUI();
    updateButtons();
  }

  applyFiltersBtn.onclick = applyFilters;

  // ===============================
  // LERNPFAD LADEN
  // ===============================

  applyLearningPathBtn.onclick = () => {
    if (!learningPath || !learningPath.weakestUnit || learningPath.weakestUnit === "-") return;

    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    autoRunning = false;
    syncGlobals();

    const [cls, unit] = learningPath.weakestUnit.split("|");

    if (cls) {
      classEl.value = cls;
      updateUnits();
    }

    if (unit) {
      unitEl.value = unit;
      updateSubs();
    }

    subEl.value = "";

    const levels = [[1,2],[1,2,3],[1,2,3,4],[1,2,3,4,5]];
    let chosenBoxes = null;
    let result = [];

    for (const lvl of levels) {
      const r = filterWords(cls, unit, "", lvl, false);
      if (r.length > 0) {
        chosenBoxes = lvl;
        result = r;
        break;
      }
    }

    if (!chosenBoxes) {
      chosenBoxes = [1,2,3,4,5];
      result = filterWords(cls, unit, "", chosenBoxes, false);
    }

    boxCheckboxes.forEach(cb => {
      const v = Number(cb.value);
      cb.checked = chosenBoxes.includes(v);
    });

    directionEl.value = "en-de";
    autoplayEl.value = "off";
    displayWrapper.style.display = "none";
    shuffleEl.checked = false;
    autoExampleEl.checked = true;
    onlyErrorsEl.checked = false;

    filtered = result;
    activeIndex = 0;
    learnedFlags = filtered.map(() => false);

    autoRunning = false;
    syncGlobals();

    finishedCard.style.display = "none";
    tableCard.style.display = "block";

    buildTable();
    updateUI();

    if (filtered.length) {
      playSequenceForIndex(activeIndex, false);
    }
  };

  // ===============================
  // FILTER-FUNKTION (V38 FIX)
  // ===============================

  function filterWords(c, u, s, boxes, onlyErrors) {
    return words.filter((w, idx) => {   // ← V38 FIX: vorher allWords

      if (c && w.class !== c) return false;
      if (u && w.unit !== u) return false;
      if (s && w.subcategory !== s) return false;

      const state = getUserWordState(user.id, lang, w.id) || {};
      const box = state.box || 1;

      if (onlyErrors) return box === 1;

      if (boxes.length && !boxes.includes(box)) return false;

      return true;
    });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  // ===============================
  // UI UPDATE
  // ===============================

  function updateUI() {
    const total = filtered.length;
    const learnedCount = learnedFlags.filter(Boolean).length;
    const percent = total ? Math.round((learnedCount / total) * 100) : 0;

    progressTextEl.textContent = `${learnedCount}/${total} Vokabeln gelernt`;
    progressBarInner.style.width = `${percent}%`;

    if (!total) {
      finishedCard.style.display = "none";
      tableCard.style.display = "block";
      updateButtons();
      return;
    }

    if (activeIndex >= total && learnedCount === total) {
      showFinishedScreen();
      return;
    }

    const mode = getMode();

    rows.forEach((row, i) => {
      const isActive = i === activeIndex;

      if (mode === "manual" || mode === "auto_single") {
        row.tr.classList.toggle("hidden-row", !isActive);
      } else {
        row.tr.classList.remove("hidden-row");
      }

      row.tr.classList.toggle("active-row", isActive);
    });

    finishedCard.style.display = "none";
    tableCard.style.display = "block";

    updateButtons();
    saveState();
  }

  // ===============================
  // AUDIO-SEQUENZ
  // ===============================

  function shouldAbort() {
    const mode = getMode();
    const isFinishedScreen = finishedCard.style.display === "block";

    if (isFinishedScreen) return false;
    if (mode === "manual") return false;

    return !autoRunning;
  }

  async function playSequenceForWord(w, autoAdvance) {
    if (window.currentLearnSessionId !== sessionId) {
      autoRunning = false;
      syncGlobals();
      return;
    }

    if (!w) return;

    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    const { baseText, baseLang, targetText, targetLang } = getDirectionParts(w);

    const index = filtered.indexOf(w);
    const row = rows[index];

    const baseSpans = row?.baseSpans;
    const targetSpans = row?.targetSpans;
    const exampleSpans = row?.exampleSpans;

    globalAudioAbort = () => window.speechSynthesis.cancel();
    syncGlobals();

    // BASE
    if (shouldAbort()) return;

    await speakAsync(baseText, baseLang, {
      rate: speechRate,
      onBoundary: createBoundaryHandler(baseSpans)
    });

    if (shouldAbort()) return;

    // TARGET
    await speakAsync(targetText, targetLang, {
      rate: speechRate,
      onBoundary: createBoundaryHandler(targetSpans)
    });

    if (shouldAbort()) return;

    // EXAMPLE
    if (autoExampleEnabled && w.example) {
      await speakAsync(w.example, langFW, {
        rate: speechRate,
        onBoundary: createBoundaryHandler(exampleSpans)
      });
    }

    if (shouldAbort()) return;

    await new Promise(r => setTimeout(r, 800));

    if (shouldAbort()) return;

    // Fortschritt
    const idx = filtered.indexOf(w);

    if (idx >= 0) {
      learnedFlags[idx] = true;
      if (autoAdvance) activeIndex = idx + 1;
      updateUI();
    }
  }

  async function playSequenceForIndex(index, autoAdvance) {
    if (index < 0 || index >= filtered.length) return;
    const w = filtered[index];
    await playSequenceForWord(w, autoAdvance);
  }

  // ===============================
  // MANUELLER SCHRITT
  // ===============================

  async function runManualStep(direction) {
    if (!filtered.length) return;
    if (isManualPlaying) return;

    if (direction === "next") {
      if (activeIndex === 0 && !learnedFlags[0]) {
        // erster Klick → bleibe auf 0
      } else if (activeIndex < filtered.length - 1) {
        activeIndex++;
      } else if (learnedFlags[activeIndex]) {
        showFinishedScreen();
        return;
      }
    } else if (direction === "prev") {
      if (activeIndex > 0) activeIndex--;
    }

    updateUI();

    isManualPlaying = true;
    await playSequenceForIndex(activeIndex, false);
    isManualPlaying = false;
  }

  // ===============================
  // AUTOPLAY SINGLE
  // ===============================

  async function autoLoopSingle() {
    if (window.currentLearnSessionId !== sessionId) {
      autoRunning = false;
      syncGlobals();
      return;
    }

    const mode = getMode();
    if (mode !== "auto_single") return;
    if (!autoRunning) return;

    if (activeIndex >= filtered.length) {
      autoRunning = false;
      syncGlobals();
      toggleBtn.textContent = "Start";
      updateButtons();
      showFinishedScreen();
      return;
    }

    await playSequenceForIndex(activeIndex, true);

    if (!autoRunning) return;

    if (activeIndex < filtered.length) {
      setTimeout(() => {
        if (autoRunning) autoLoopSingle();
      }, 0);
    } else {
      autoRunning = false;
      syncGlobals();
      toggleBtn.textContent = "Start";
      updateButtons();
      showFinishedScreen();
    }
  }

  // ===============================
  // AUTOPLAY ALLE
  // ===============================

  async function autoLoopAll() {
    if (window.currentLearnSessionId !== sessionId) {
      autoRunning = false;
      syncGlobals();
      return;
    }

    const mode = getMode();
    if (mode !== "auto_all") return;
    if (!autoRunning) return;

    if (activeIndex >= filtered.length) {
      autoRunning = false;
      syncGlobals();
      toggleBtn.textContent = "Start";
      updateButtons();
      showFinishedScreen();
      return;
    }

    updateUI();
    await playSequenceForIndex(activeIndex, true);

    if (!autoRunning) return;

    if (activeIndex < filtered.length) {
      setTimeout(() => {
        if (autoRunning) autoLoopAll();
      }, 0);
    } else {
      autoRunning = false;
      syncGlobals();
      toggleBtn.textContent = "Start";
      updateButtons();
      showFinishedScreen();
    }
  }

  // ===============================
  // BUTTON EVENTS
  // ===============================

  backBtn.onclick = async () => {
    const mode = getMode();
    if (mode !== "manual") return;

    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    await runManualStep("prev");
  };

  toggleBtn.onclick = async () => {
    const mode = getMode();

    // MANUAL
    if (mode === "manual") {
      if (globalAudioAbort) globalAudioAbort();
      window.speechSynthesis.cancel();
      await runManualStep("next");
      return;
    }

    // AUTOPLAY
    if (!filtered.length) return;

    // START
    if (!autoRunning) {
      autoRunning = true;
      syncGlobals();
      toggleBtn.textContent = "Pause";
      saveState(true);

      if (activeIndex >= filtered.length) activeIndex = 0;

      updateUI();

      if (mode === "auto_single") autoLoopSingle();
      else autoLoopAll();

      return;
    }

    // PAUSE
    autoRunning = false;
    syncGlobals();
    toggleBtn.textContent = "Start";

    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    saveState(false);
    updateButtons();
  };
  // ===============================
  // TABELLE AUFBAUEN
  // ===============================

  function buildTable() {
    tbody.innerHTML = "";
    rows = [];

    filtered.forEach((w, i) => {
      const tr = document.createElement("tr");
      tr.dataset.index = i;

      const dir = directionEl.value;
      const base = dir === "de-en" ? w.translation : w.word;
      const target = dir === "de-en" ? w.word : w.translation;

      const baseTd = document.createElement("td");
      const targetTd = document.createElement("td");
      const exampleTd = document.createElement("td");
      const actionsTd = document.createElement("td");
      actionsTd.className = "cell-actions";

      const baseParts = createWordSpanElements(base || "");
      const targetParts = createWordSpanElements(target || "");
      const exampleParts = createWordSpanElements(autoExampleEnabled ? (w.example || "") : "");

      baseTd.appendChild(baseParts.frag);
      targetTd.appendChild(targetParts.frag);
      exampleTd.appendChild(exampleParts.frag);

      const mode = getMode();

      if (mode === "manual") {
        const repeatBtn = document.createElement("button");
        repeatBtn.textContent = "🔊";
        repeatBtn.className = "btn-secondary";
        repeatBtn.onclick = () => playSequenceForIndex(i, false);
        actionsTd.appendChild(repeatBtn);
      }

      tr.appendChild(baseTd);
      tr.appendChild(targetTd);
      tr.appendChild(exampleTd);
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);

      rows.push({
        tr,
        word: w,
        baseSpans: baseParts.spans,
        targetSpans: targetParts.spans,
        exampleSpans: exampleParts.spans
      });
    });
  }

  // ===============================
  // BUTTON-STATUS
  // ===============================

  function updateButtons() {
    const mode = getMode();

    if (mode === "manual") {
      const isFirstStart =
        activeIndex === 0 &&
        autoRunning === false &&
        !learnedFlags[0];

      toggleBtn.textContent = isFirstStart ? "Start" : "Weiter";
      backBtn.disabled = activeIndex === 0;
      return;
    }

    toggleBtn.textContent = autoRunning ? "Pause" : "Start";
    backBtn.disabled = true;
  }

  // ===============================
  // FINISHED-SCREEN
  // ===============================

  const finishedCard = document.createElement("div");
  finishedCard.className = "card learn-finished";
  finishedCard.style.display = "none";

  finishedCard.innerHTML = `
    <h3>Super gemacht!</h3>
    <p class="learn-finished-text"></p>

    <table class="learn-table learn-finished-table">
      <thead>
        <tr>
          <th>Vokabel</th>
          <th>Übersetzung</th>
          <th>Beispiel</th>
          <th></th>
        </tr>
      </thead>
      <tbody class="learn-finished-body"></tbody>
    </table>

    <button class="btn-primary learn-finished-restart">Nochmal lernen</button>
    <button class="btn-primary learn-finished-trainer">Im Trainer weiterlernen</button>
  `;

  app.appendChild(finishedCard);

  const finishedText = finishedCard.querySelector(".learn-finished-text");
  const finishedBody = finishedCard.querySelector(".learn-finished-body");
  const finishedRestart = finishedCard.querySelector(".learn-finished-restart");

  function showFinishedScreen() {
    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    autoRunning = false;
    syncGlobals();

    tableCard.style.display = "none";
    finishedCard.style.display = "block";

    const dir = directionEl.value;
    finishedText.textContent = `Du hast ${filtered.length} Vokabeln gelernt.`;

    finishedBody.innerHTML = "";

    filtered.forEach(w => {
      const base = dir === "de-en" ? w.translation : w.word;
      const target = dir === "de-en" ? w.word : w.translation;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${base}</td>
        <td>${target}</td>
        <td>${autoExampleEnabled ? (w.example || "") : ""}</td>
        <td><button class="btn-secondary btn-finished-audio">🔊</button></td>
      `;

      tr.querySelector(".btn-finished-audio").onclick = () =>
        playSequenceForWord(w, false);

      finishedBody.appendChild(tr);
    });

    saveState(false);
  }

  finishedRestart.onclick = () => {
    if (globalAudioAbort) globalAudioAbort();
    window.speechSynthesis.cancel();

    autoRunning = false;
    syncGlobals();

    learnedFlags = filtered.map(() => false);
    activeIndex = 0;

    finishedCard.style.display = "none";
    tableCard.style.display = "block";

    const mode = getMode();
    toggleBtn.textContent = mode === "manual" ? "Weiter" : "Start";

    updateUI();
  };

  const finishedTrainerBtn = finishedCard.querySelector(".learn-finished-trainer");

  finishedTrainerBtn.onclick = () => {
    const c = classEl.value;
    const u = unitEl.value;
    const s = subEl.value;

    localStorage.setItem("trainerFilterClass", c || "");
    localStorage.setItem("trainerFilterUnit", u || "");
    localStorage.setItem("trainerFilterSub", s || "");

    const nav = window.navigate || (p => import(p).then(m => m.render()));
    nav("/src/pages/trainer.js");
  };

  // ===============================
  // HILFSFUNKTIONEN
  // ===============================

  function getDirectionParts(w) {
    const dir = directionEl.value;

    if (dir === "de-en") {
      return {
        baseText: w.translation,
        baseLang: langDE,
        targetText: w.word,
        targetLang: langFW
      };
    } else {
      return {
        baseText: w.word,
        baseLang: langFW,
        targetText: w.translation,
        targetLang: langDE
      };
    }
  }

  function clearAllHighlights() {
    rows.forEach(r => {
      if (r.baseSpans) r.baseSpans.forEach(s => s.classList.remove("highlight-blue"));
      if (r.targetSpans) r.targetSpans.forEach(s => s.classList.remove("highlight-blue"));
      if (r.exampleSpans) r.exampleSpans.forEach(s => s.classList.remove("highlight-blue"));
    });
  }

  function createBoundaryHandler(spans) {
    if (!spans || !spans.length) return () => {};

    let idx = 0;

    return (e) => {
      if (e.name !== "word") return;

      clearAllHighlights();

      if (idx < spans.length) {
        spans[idx].classList.add("highlight-blue");
        idx += 1;
      }
    };
  }

  function createWordSpanElements(text) {
    const spans = [];
    const frag = document.createDocumentFragment();

    if (!text) return { frag, spans };

    const parts = text.split(/(\s+)/);

    parts.forEach(p => {
      if (p.trim() === "") {
        frag.appendChild(document.createTextNode(p));
      } else {
        const span = document.createElement("span");
        span.textContent = p;
        span.className = "word";
        frag.appendChild(span);
        spans.push(span);
      }
    });

    return { frag, spans };
  }

  // ===============================
  // STATE SAVE / RESTORE
  // ===============================

  function getMode() {
    if (autoplayEl.value === "off") return "manual";
    if (displayEl.value === "single") return "auto_single";
    return "auto_all";
  }

  function saveState(wasRunning = autoRunning) {
    const learnedIndices = learnedFlags
      .map((v, i) => v ? i : -1)
      .filter(i => i >= 0);

    const state = {
      total: filtered.length,
      activeIndex,
      learnedIndices,
      mode: getMode(),
      wasRunning
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ===============================
  // INITIAL: FILTER ANWENDEN
  // ===============================

  applyFilters();

  // ===============================
  // STATE RESTORE
  // ===============================

  const saved = loadState();

  if (saved && saved.total === filtered.length && filtered.length) {
    activeIndex = Math.min(saved.activeIndex, filtered.length - 1);
    learnedFlags = filtered.map((_, i) => saved.learnedIndices.includes(i));

    updateUI();

    const currentMode = getMode();

    if (saved.wasRunning && (saved.mode === currentMode)) {
      if (window.confirm("Möchtest du weitermachen?")) {
        autoRunning = true;
        syncGlobals();
        toggleBtn.textContent = "Pause";

        if (currentMode === "auto_single") autoLoopSingle();
        else if (currentMode === "auto_all") autoLoopAll();
      } else {
        autoRunning = false;
        syncGlobals();
        toggleBtn.textContent = currentMode === "manual" ? "Weiter" : "Start";
        saveState(false);
      }
    } else {
      autoRunning = false;
      syncGlobals();
      toggleBtn.textContent = currentMode === "manual" ? "Weiter" : "Start";
      saveState(false);
    }
  }

} // ← Ende render()

// ===============================
// ENDE DER DATEI
// ===============================
