// =========================================================
// Dashboard V12 – SprachHero (FINAL, ID‑basiert + async CSV)
// =========================================================

import {
  getCurrentUser,
  getGlobal,
  getWordsForLang,
  getUserWordState,
  getLevel,
  getStreak,
  getUserSession,
  getGlobalCorrectWrong,
  getUserProgress
} from "../core/storage.js";

import { speak } from "../core/audio.js";

function safe(id, root = document) {
  return root.getElementById ? root.getElementById(id) : root.querySelector(`#${id}`);
}

function createAccordion(icon, title) {
  const wrapper = document.createElement("div");
  wrapper.className = "accordion-block";

  const header = document.createElement("div");
  header.className = "accordion-header db-collapsed";
  header.innerHTML = `
    <span class="acc-icon">${icon}</span>
    <span class="acc-title">${title}</span>
    <span class="acc-arrow">▶</span>
  `;

  const body = document.createElement("div");
  body.className = "accordion-body db-collapsed";

  header.onclick = () => {
    const collapsed = body.classList.contains("db-collapsed");
    if (collapsed) {
      body.classList.remove("db-collapsed");
      header.classList.remove("db-collapsed");
      header.querySelector(".acc-arrow").textContent = "▼";
    } else {
      body.classList.add("db-collapsed");
      header.classList.add("db-collapsed");
      header.querySelector(".acc-arrow").textContent = "▶";
    }
  };

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  return { wrapper, header, body };
}



// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function clean(v) { return (v || "").trim(); }
function fmt(sec) { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}m ${s}s`; }
function fmtHM(sec) { const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); return `${h}h ${m}m`; }

function speakWordAndExampleDash(word, example) {
  speak(word);
  if (example) setTimeout(() => speak(example), 1200);
}

// ---------------------------------------------------------
// EXPORT: RENDER
// ---------------------------------------------------------

export async function render() {   // FIX: async
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  app.innerHTML = "";
  document.body.style.overflowY = "auto";

  const global = getGlobal();
  const lang = global.language;

  // -----------------------------------------------------
  // Basisdaten
  // -----------------------------------------------------

  const progress = getUserProgress(user.id) || {};
  const xp = progress.totalXp || 0;
  const level = getLevel(xp);
  const streak = getStreak(user.id);
  const session = getUserSession(user.id);

  const totalSeconds = session.totalSeconds || 0;
  const longest = session.longestSession || 0;
  const sessionsCompleted = session.sessionsCompleted || 0;
  const history = session.history || [];

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  let todaySeconds = 0, todayXp = 0, todayWords = 0;
  let weekSeconds = 0, weekXp = 0, weekWords = 0;

  history.forEach(h => {
    if (!h.date) return;

    if (h.date === today) {
      todaySeconds += h.seconds || 0;
      todayXp += h.xp || 0;
      todayWords += h.words || 0;
    }

    if (h.date >= weekStartStr) {
      weekSeconds += h.seconds || 0;
      weekXp += h.xp || 0;
      weekWords += h.words || 0;
    }
  });

  const avgSeconds = sessionsCompleted > 0 ? Math.round(totalSeconds / sessionsCompleted) : 0;
  const efficiency = totalSeconds > 0 ? (xp / (totalSeconds / 60)).toFixed(1) : 0;

  // -----------------------------------------------------
  // Dashboard Header
  // -----------------------------------------------------

  const overview = document.createElement("div");
  overview.className = "card dashboard-card full-width";

  overview.innerHTML = `
    <h2>Dashboard</h2>
    <p class="small">Aktive Sprache: ${lang.toUpperCase()} – Nutzer: ${user.name}</p>

    <div class="xp-bar-wrapper">
      <div class="xp-bar-label small">Level ${level} – ${xp % 300} / 300 XP</div>
      <div class="xp-bar-bg">
        <div id="xpBarFill" style="width:${Math.min(100, Math.round((xp % 300) / 3))}%"></div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dash-card"><span class="dash-card-label">Level</span><div class="dash-card-value">${level}</div></div>
      <div class="dash-card"><span class="dash-card-label">XP</span><div class="dash-card-value">${xp}</div></div>
      <div class="dash-card"><span class="dash-card-label">Streak</span><div class="dash-card-value">${streak.current} (Best: ${streak.best})</div></div>
      <div class="dash-card"><span class="dash-card-label">Sessions</span><div class="dash-card-value">${sessionsCompleted}</div></div>
      <div class="dash-card"><span class="dash-card-label">Ø Dauer</span><div class="dash-card-value">${fmt(avgSeconds)}</div></div>
      <div class="dash-card"><span class="dash-card-label">Effizienz</span><div class="dash-card-value">${efficiency}</div></div>
    </div>
  `;

  app.appendChild(overview);

  // -----------------------------------------------------
  // Lernanalyse – Wörter erst laden, wenn Filter angewendet wird
  // -----------------------------------------------------

  const accMain = createAccordion("📊", "Lernanalyse");
  accMain.header.classList.add("lernanalyse-sticky");
  app.appendChild(accMain.wrapper);

  // Filter-UI
  const filterBox = document.createElement("div");
  filterBox.className = "filter-box";

  filterBox.innerHTML = `
    <h4>Filter</h4>

    <label>Klasse:</label>
    <select id="dashFilterClass"><option value="">Alle</option></select>

    <label>Kapitel:</label>
    <select id="dashFilterUnit"><option value="">Alle</option></select>

    <label>Lektion:</label>
    <select id="dashFilterSub"><option value="">Alle</option></select>

    <label>Boxen:</label>
    <div class="box-filter-row">
      ${[1,2,3,4,5].map(b => `
        <label><input type="checkbox" class="dashFilterBox" value="${b}"> Box ${b}</label>
      `).join("")}
    </div>

    <button id="applyFilterBtn" class="btn-primary">Filter anwenden</button>
    <div id="filterBadges" class="filter-badge-row"></div>
  `;

  accMain.body.appendChild(filterBox);

  // Analyse-Bereiche
  const metaBox = document.createElement("div");
  metaBox.id = "metaBoxStats";

  const metaClass = document.createElement("div");
  metaClass.id = "metaClassStats";

  const metaUnit = document.createElement("div");
  metaUnit.id = "metaUnitStats";

  const tableContainer = document.createElement("div");
  tableContainer.className = "table-wrapper";

  accMain.body.appendChild(metaBox);
  accMain.body.appendChild(metaClass);
  accMain.body.appendChild(metaUnit);
  accMain.body.appendChild(tableContainer);

  // -----------------------------------------------------
  // Wörter laden (async!)
  // -----------------------------------------------------

  let wordsLoaded = false;
  let allWords = [];

  async function loadWordsIfNeeded() {   // FIX: async
    if (!wordsLoaded) {
      allWords = await getWordsForLang(lang);   // FIX: async
      wordsLoaded = true;

      const classes = [...new Set(allWords.map(w => clean(w.class)).filter(Boolean))]
        .sort((a,b) => Number(a) - Number(b));

      filterClass.innerHTML =
        `<option value="">Alle</option>` +
        classes.map(c => `<option value="${c}">${c}</option>`).join("");
    }
  }

  const filterClass = filterBox.querySelector("#dashFilterClass");
  const filterUnit = filterBox.querySelector("#dashFilterUnit");
  const filterSub = filterBox.querySelector("#dashFilterSub");
  const filterBadges = filterBox.querySelector("#filterBadges");

  // Klassen sofort laden
  await loadWordsIfNeeded();   // FIX

  filterClass.onchange = async () => {
    await loadWordsIfNeeded();

    const classVal = clean(filterClass.value);

    if (!classVal) {
      filterUnit.innerHTML = `<option value="">Alle</option>`;
      filterSub.innerHTML = `<option value="">Alle</option>`;
      return;
    }

    const units = [...new Set(
      allWords.filter(w => clean(w.class) === classVal)
        .map(w => clean(w.unit))
        .filter(Boolean)
    )].sort();

    filterUnit.innerHTML =
      `<option value="">Alle</option>` +
      units.map(u => `<option value="${u}">${u}</option>`).join("");

    filterSub.innerHTML = `<option value="">Alle</option>`;
  };

  filterUnit.onchange = () => {
    const classVal = clean(filterClass.value);
    const unitVal = clean(filterUnit.value);

    if (!unitVal) {
      filterSub.innerHTML = `<option value="">Alle</option>`;
      return;
    }

    const subs = [...new Set(
      allWords.filter(w =>
        clean(w.class) === classVal &&
        clean(w.unit) === unitVal
      ).map(w => clean(w.subcategory)).filter(Boolean)
    )].sort();

    filterSub.innerHTML =
      `<option value="">Alle</option>` +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");
  };
// -----------------------------------------------------
// Filter anwenden → Wörter laden → Analyse berechnen
// -----------------------------------------------------

const applyFilterBtn = filterBox.querySelector("#applyFilterBtn");
if (applyFilterBtn) applyFilterBtn.onclick = async () => {   // FIX: async
  await loadWordsIfNeeded();   // FIX

  const classVal = clean(filterClass.value);
  const unitVal = clean(filterUnit.value);
  const subVal = clean(filterSub.value);

  const boxes = [...filterBox.querySelectorAll(".dashFilterBox:checked")]
    .map(cb => Number(cb.value));

  // Badges aktualisieren
  filterBadges.innerHTML = "";

  if (classVal) filterBadges.innerHTML += `<span class="filter-badge">Klasse ${classVal}</span>`;
  if (unitVal) filterBadges.innerHTML += `<span class="filter-badge">Unit ${unitVal}</span>`;
  if (subVal) filterBadges.innerHTML += `<span class="filter-badge">Unterkapitel ${subVal}</span>`;
  if (boxes.length > 0) filterBadges.innerHTML += `<span class="filter-badge">Boxen: ${boxes.join(", ")}</span>`;

  if (!filterBadges.innerHTML)
    filterBadges.innerHTML = `<span class="filter-badge-empty">Keine aktiven Filter</span>`;

  // Wörter filtern
  let filtered = allWords.map(w => {
    // FIX: WordState über ID statt Index
    const s = getUserWordState(user.id, lang, w.id);

    const correct = s.correct || 0;
    const wrong = s.wrong || 0;
    const times = correct + wrong;
    const success = times > 0 ? Math.round((correct / times) * 100) : 0;

    return {
      ...w,
      _box: s.box || 1,
      _correct: correct,
      _wrong: wrong,
      _times: times,
      _success: success
    };
  });

  if (classVal) filtered = filtered.filter(w => clean(w.class) === classVal);
  if (unitVal) filtered = filtered.filter(w => clean(w.unit) === unitVal);
  if (subVal) filtered = filtered.filter(w => clean(w.subcategory) === subVal);
  if (boxes.length > 0) filtered = filtered.filter(w => boxes.includes(w._box));

  renderMetaStats(filtered);
  renderTable(filtered);
};

// -----------------------------------------------------
// Analyse-Bereiche rendern
// -----------------------------------------------------

function renderMetaStats(words) {

  // Box-Verteilung
  const boxCounts = [0,0,0,0,0];
  words.forEach(w => boxCounts[w._box - 1]++);

  metaBox.innerHTML = `
    <h3 class="section-title">Box-Verteilung</h3>
    ${boxCounts.map((count, i) => `
      <div class="meta-row">
        <span class="meta-label">Box ${i+1}</span>
        <div class="meta-bar"><div style="width:${words.length ? Math.min(100, count / words.length * 100) : 0}%"></div></div>
        <span class="meta-value">${count}</span>
      </div>
    `).join("")}
  `;

  // Klassen-Fortschritt
  const classMap = {};

  words.forEach(w => {
    const c = clean(w.class);
    if (!c) return;

    if (!classMap[c]) classMap[c] = { total: 0, known: 0 };

    classMap[c].total++;
    if (w._success >= 70) classMap[c].known++;
  });

  metaClass.innerHTML = `
    <h3 class="section-title">Fortschritt nach Klassen</h3>
    ${Object.keys(classMap).sort((a,b)=>Number(a)-Number(b)).map(c => {
      const obj = classMap[c];
      const pct = obj.total > 0 ? Math.round(obj.known / obj.total * 100) : 0;

      return `
        <div class="meta-row">
          <span class="meta-label">Klasse ${c}</span>
          <div class="meta-bar"><div style="width:${pct}%"></div></div>
          <span class="meta-value">${pct}%</span>
        </div>
      `;
    }).join("")}
  `;

  // Units-Fortschritt
  const unitMap = {};

  words.forEach(w => {
    const u = clean(w.unit);
    if (!u) return;

    if (!unitMap[u]) unitMap[u] = { total: 0, known: 0 };

    unitMap[u].total++;
    if (w._success >= 70) unitMap[u].known++;
  });

  metaUnit.innerHTML = `
    <h3 class="section-title">Fortschritt nach Kapiteln</h3>
    ${Object.keys(unitMap).sort().map(u => {
      const obj = unitMap[u];
      const pct = obj.total > 0 ? Math.round(obj.known / obj.total * 100) : 0;

      return `
        <div class="meta-row">
          <span class="meta-label">${u}</span>
          <div class="meta-bar"><div style="width:${pct}%"></div></div>
          <span class="meta-value">${pct}%</span>
        </div>
      `;
    }).join("")}
  `;
}

// -----------------------------------------------------
// Tabelle rendern
// -----------------------------------------------------

let currentSort = { key: null, dir: 1 };

function renderTable(words) {

  tableContainer.innerHTML = `
    <table class="vocab-table" id="dashTable">
      <thead>
        <tr>
          <th data-key="word">Wort</th>
          <th data-key="translation">Übersetzung</th>
          <th data-key="_box">Box</th>
          <th data-key="_success">Erfolg %</th>
          <th data-key="_times">Häufigkeit</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${words.map(w => `
          <tr>
            <td>${w.word}</td>
            <td>${w.translation}</td>
            <td>${w._box}</td>
            <td>${w._success}%</td>
            <td>${w._times}</td>
            <td><button class="btn-small" data-id="${w.id}">Details</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const table = tableContainer.querySelector("#dashTable");
  const headers = table.querySelectorAll("th[data-key]");

  headers.forEach(th => {
    const key = th.dataset.key;
    let arrow = "";

    if (currentSort.key === key) {
      arrow = currentSort.dir === 1 ? " ▲" : " ▼";
    }

    th.textContent = th.textContent.split(" ")[0] + arrow;

    th.onclick = () => {
      const k = th.dataset.key;

      if (currentSort.key === k) {
        currentSort.dir *= -1;
      } else {
        currentSort.key = k;
        currentSort.dir = 1;
      }

      const sorted = [...words].sort((a,b) => {
        if (a[k] < b[k]) return -1 * currentSort.dir;
        if (a[k] > b[k]) return 1 * currentSort.dir;
        return 0;
      });

      renderTable(sorted);
    };
  });

  // Details-Buttons aktivieren
  table.querySelectorAll("button[data-id]").forEach(btn => {
    btn.onclick = () => showDetails(btn.dataset.id);
  });
}

// -----------------------------------------------------
// Details-Modal
// -----------------------------------------------------

function showDetails(wordId) {

  const w = allWords.find(x => x.id === wordId);   // FIX: ID statt idx
  const s = getUserWordState(user.id, lang, wordId);   // FIX

  const correct = s.correct || 0;
  const wrong = s.wrong || 0;
  const times = correct + wrong;
  const success = times > 0 ? Math.round((correct / times) * 100) : 0;

  const modal = document.createElement("div");
  modal.className = "dashboard-details-modal";

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close-btn">×</button>

      <div class="details-header">
        <h3>${w.word}</h3>
        <span class="badge-box">Box ${s.box || 1}</span>
        <span class="badge-success">${success}% Erfolg</span>
      </div>

      <div class="details-section">
        <p><strong>Übersetzung:</strong> ${w.translation}</p>
        <p><strong>Beispiel:</strong></p>
        <div class="details-example">${w.example || "-"}</div>
      </div>

      <div class="details-section">
        <p><strong>Häufigkeit:</strong> ${times}</p>
      </div>

      <div class="details-actions">
        <button id="btnSpeak" class="btn-primary">Anhören</button>
        <button id="btnTrainer" class="btn-secondary">Im Trainer öffnen</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".modal-close-btn").onclick = () => modal.remove();

  modal.querySelector("#btnSpeak").onclick = () => {
    speakWordAndExampleDash(w.word, w.example);
  };

  modal.querySelector("#btnTrainer").onclick = () => {
    import("./trainer.js").then(m => {
      modal.remove();
      m.renderSingleWord?.(wordId);   // FIX: ID statt idx
    });
  };
}
}
