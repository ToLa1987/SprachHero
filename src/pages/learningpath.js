// =========================================================
// learningpath.js – FINAL (ID-basiert + async CSV)
// =========================================================

import {
  getCurrentUser,
  getUserWordState,
  getWordsForLang,
  getGlobal
} from "../core/storage.js";

import { navigate } from "../core/navigation.js";

// =========================================================
// GLOBAL STATE (Fix: global sichtbar, async-safe)
// =========================================================

window.lpInitialRenderDone = false;

const lpExpanded = {
  class: new Set(),
  unit: new Set(),
  sub: new Set()
};

const lpCollapsed = new Set();
let lpNodes = [];
let lpCardElements = [];
let lpSpyContainer = null;
let isSyncScrolling = false;

// =========================================================
// STATS
// =========================================================

function computeStatsForGroup(groupWords, userId, lang) {
  const total = groupWords.length;
  const boxCounts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  let lastTraining = 0;

  groupWords.forEach(({ w }) => {
    const s = getUserWordState(userId, lang, w.id) || {};
    const b = s.box || 1;
    boxCounts[b]++;
    if (s.lastTrainedAt && s.lastTrainedAt > lastTraining) {
      lastTraining = s.lastTrainedAt;
    }
  });

  const learnedPct = total > 0
    ? Math.round(((boxCounts[4] + boxCounts[5]) / total) * 100)
    : 0;

  return { total, boxCounts, learnedPct, lastTraining };
}

function formatLastTraining(ts) {
  if (!ts) return "Noch nie";
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000*60*60*24));
  return days === 0 ? "Heute" : `vor ${days} Tagen`;
}

function buildRecommendation(pct) {
  if (pct <= 20) return "Perfekt für einen Einstieg.";
  if (pct <= 60) return "Guter Mix aus neuen und bekannten Wörtern.";
  if (pct <= 90) return "Fast geschafft.";
  return "Sehr gut! Fast vollständig gemeistert.";
}

// =========================================================
// STRUKTUR
// =========================================================

function buildStructure(words) {
  const map = {};

  words.forEach(w => {
    const cls = w.class;
    const unit = w.unit;
    const sub = w.subcategory || "-";
    if (!cls || !unit) return;

    if (!map[cls]) map[cls] = {};
    if (!map[cls][unit]) map[cls][unit] = {};
    if (!map[cls][unit][sub]) map[cls][unit][sub] = [];

    map[cls][unit][sub].push({ w });
  });

  return map;
}
// =========================================================
// KEY HELPERS
// =========================================================

function getNodeKey(node) {
  return `${node.level}|${node.class}|${node.unit || ""}|${node.sub || ""}`;
}

function isNodeCollapsed(node) {
  return !lpCollapsed.has(getNodeKey(node));
}

function toggleNodeCollapsedByKey(key) {
  if (lpCollapsed.has(key)) lpCollapsed.delete(key);
  else lpCollapsed.add(key);
}

// =========================================================
// SICHTBARE NODES
// =========================================================

function buildVisibleNodes(structure) {
  const nodes = [];

  Object.keys(structure)
    .sort((a,b)=>Number(a)-Number(b))
    .forEach(cls => {

      const classWords = [];
      Object.values(structure[cls]).forEach(unitObj => {
        Object.values(unitObj).forEach(subArr => classWords.push(...subArr));
      });

      nodes.push({
        level: "class",
        class: cls,
        unit: null,
        sub: null,
        words: classWords
      });

      if (!lpExpanded.class.has(cls)) return;

      Object.keys(structure[cls]).sort().forEach(unit => {
        const unitWords = [];
        Object.values(structure[cls][unit]).forEach(subArr => unitWords.push(...subArr));

        nodes.push({
          level: "unit",
          class: cls,
          unit,
          sub: null,
          words: unitWords
        });

        const unitKey = `${cls}|${unit}`;
        if (!lpExpanded.unit.has(unitKey)) return;

        Object.keys(structure[cls][unit]).sort().forEach(sub => {
          nodes.push({
            level: "sub",
            class: cls,
            unit,
            sub,
            words: structure[cls][unit][sub]
          });
        });
      });
    });

  return nodes;
}

// =========================================================
// RENDER ENGINE
// =========================================================

async function internalRender() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("../pages/start.js").then(m => m.render());
    return;
  }

  const lang = getGlobal().language;
  const words = await getWordsForLang(lang) || [];

  app.innerHTML = `
    <section class="lp-root">
      <div class="lp-header">
        <h1>Lernpfad</h1>
        <div class="lp-view-switch">
          <button data-mode="class">Klasse</button>
          <button data-mode="unit">Lektion</button>
          <button data-mode="sub">Unterkapitel</button>
        </div>
      </div>

      <div class="lp-main-area">
        <div class="lp-path-container"></div>
        <div class="lp-scrollspy"></div>
      </div>
    </section>

    <div class="lp-details-overlay" id="lp-details-overlay">
      <div class="lp-details-panel">
        <div class="lp-details-header">
          <h2 id="lp-details-title"></h2>
          <button id="lp-details-close">✕</button>
        </div>

        <div class="lp-details-tabs">
          <button data-tab="words" class="active">Wörterliste</button>
        </div>

        <div class="lp-details-body">
          <div class="lp-details-tab" data-tab="words"></div>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById("lp-details-overlay");
  overlay.onclick = e => {
    if (e.target === overlay) overlay.classList.remove("open");
  };
  document.getElementById("lp-details-close").onclick = () =>
    overlay.classList.remove("open");

  const lpPathContainer = app.querySelector(".lp-path-container");
  const spyContainer = app.querySelector(".lp-scrollspy");
  lpSpyContainer = spyContainer;

  const switchButtons = [...app.querySelectorAll(".lp-view-switch button")];

  function updateViewSwitchButtons() {
    switchButtons.forEach(b => b.classList.remove("active"));
  }

  switchButtons.forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      const structure = buildStructure(words);

      if (mode === "class") {
        if (lpExpanded.class.size > 0) {
          lpExpanded.class.clear();
          lpExpanded.unit.clear();
          lpExpanded.sub.clear();
        } else {
          Object.keys(structure).forEach(cls => lpExpanded.class.add(cls));
        }
      }

      if (mode === "unit") {
        if (lpExpanded.unit.size > 0) {
          lpExpanded.unit.clear();
          lpExpanded.sub.clear();
        } else {
          Object.keys(structure).forEach(cls => {
            lpExpanded.class.add(cls);
            Object.keys(structure[cls]).forEach(unit => {
              lpExpanded.unit.add(`${cls}|${unit}`);
            });
          });
        }
      }

      if (mode === "sub") {
        if (lpExpanded.sub.size > 0) {
          lpExpanded.sub.clear();
        } else {
          Object.keys(structure).forEach(cls => {
            lpExpanded.class.add(cls);
            Object.keys(structure[cls]).forEach(unit => {
              lpExpanded.unit.add(`${cls}|${unit}`);
              Object.keys(structure[cls][unit]).forEach(sub => {
                lpExpanded.sub.add(`${cls}|${unit}|${sub}`);
              });
            });
          });
        }
      }

      renderPath();
    };
  });

  function renderPath() {
    const structure = buildStructure(words);
    const nodes = buildVisibleNodes(structure);

    lpNodes.length = 0;
    lpNodes.push(...nodes);

    lpPathContainer.innerHTML = "";
    spyContainer.innerHTML = "";
    lpCardElements.length = 0;

    nodes.forEach(node => {
      const stats = computeStatsForGroup(node.words, user.id, lang);
      const lastTrainText = formatLastTraining(stats.lastTraining);
      const recommendation = buildRecommendation(stats.learnedPct);

      const card = document.createElement("div");
      card.className = "lp-tile";
      card.classList.add(`lp-level-${node.level}`);

      let collapsed;
      if (!window.lpInitialRenderDone) collapsed = true;
      else collapsed = isNodeCollapsed(node);

      if (collapsed) card.classList.add("collapsed");

      if (node.level === "class") card.classList.add("lp-class-tile");
      else if (node.level === "unit") card.classList.add("lp-unit-tile");
      else {
        if (stats.learnedPct < 30) card.classList.add("danger");
        else if (stats.learnedPct < 70) card.classList.add("warning");
        else card.classList.add("success");
      }

      const expanded = isNodeExpanded(node);

      let structLabel = "";
      if (node.level === "class") structLabel = expanded ? "– Lektion" : "+ Lektion";
      if (node.level === "unit") structLabel = expanded ? "– Unterkapitel" : "+ Unterkapitel";

      const structBtn = node.level === "sub" ? "" : `
        <button class="btn-secondary lp-struct-inline-btn">${structLabel}</button>
      `;

      const nodeKey = getNodeKey(node);

      card.innerHTML = `
        <div class="lp-title">${buildTitle(node)}</div>
        <p><strong>${stats.total}</strong> Wörter insgesamt</p>

        <div class="lp-progressbar">
          <div class="lp-progress-fill" style="width:${stats.learnedPct}%"></div>
        </div>

        <p class="lp-progress-text">${stats.learnedPct}% gelernt</p>

        <div class="lp-collapse-fixed">
          <button class="lp-collapse-btn" data-key="${nodeKey}">
            ${collapsed ? "+" : "–"}
          </button>
        </div>

        <div class="lp-extra ${collapsed ? "hidden" : ""}">
          <div class="lp-row-flex">
            <div class="lp-box-column">
              <p class="lp-lasttrain">Letztes Training: ${lastTrainText}</p>

              <div class="lp-box-status-list">
                ${[1,2,3,4,5].map(b => {
                  const count = stats.boxCounts[b];
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return `
                    <div class="lp-box-status-row">
                      <strong>Box ${b}:</strong>
                      ${count > 0 ? `${count} Wörter (${pct}%)` : `---`}
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="lp-mini-heat">
                ${[1,2,3,4,5].map(b => {
                  const pct = Math.round((stats.boxCounts[b] / (stats.total || 1)) * 100);
                  return `
                    <div class="mh mh-${b}">
                      <div class="mh-fill" style="height:${pct}%"></div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="lp-button-column">
              <button class="btn-primary lp-learn-btn">Lernen starten</button>
              <button class="btn-primary lp-train-btn">Im Trainer weiterlernen</button>

              <div class="lp-actions-row-split">
                <button class="btn-secondary lp-details-btn">Wörterliste</button>
                ${structBtn}
              </div>
            </div>
          </div>
        </div>
      `;

      // Collapse
      const collapseBtnEl = card.querySelector(".lp-collapse-btn");
      if (collapseBtnEl) {
        collapseBtnEl.onclick = () => {
          toggleNodeCollapsedByKey(collapseBtnEl.dataset.key);
          renderPath();
        };
      }

      // Expand
      const structInlineBtn = card.querySelector(".lp-struct-inline-btn");
      if (structInlineBtn) {
        structInlineBtn.onclick = () => {
          toggleNodeExpand(node);
          renderPath();
        };
      }

      // Learn
      card.querySelector(".lp-learn-btn").onclick = () => {
        localStorage.setItem("learnFilterClass", node.class || "");
        localStorage.setItem("learnFilterUnit", node.unit || "");
        localStorage.setItem("learnFilterSub", node.sub || "");
        navigate("learn");
      };

      // Trainer
      card.querySelector(".lp-train-btn").onclick = () => {
        localStorage.setItem("trainerFilterClass", node.class || "");
        localStorage.setItem("trainerFilterUnit", node.unit || "");
        localStorage.setItem("trainerFilterSub", node.sub || "");
        navigate("trainer");
      };

      // Details
      card.querySelector(".lp-details-btn").onclick = () => {
        openDetails(node, stats, lastTrainText, recommendation);
      };

      lpPathContainer.appendChild(card);
      lpCardElements.push(card);

      // Scrollspy
      const spyKey = getNodeKey(node);
      const spyItem = document.createElement("div");
      spyItem.className = `lp-spy-item lp-spy-level-${node.level}`;
      spyItem.dataset.key = spyKey;

      spyItem.textContent =
        node.sub ? `${node.class}.${node.unit} – ${node.sub}` :
        node.unit ? `${node.class}.${node.unit}` :
        `Klasse ${node.class}`;

      spyItem.onclick = () => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      spyContainer.appendChild(spyItem);
    });

    drawArrows(lpPathContainer);
    updateScrollSpyActive();
  }

  updateViewSwitchButtons();
  renderPath();

  window.lpInitialRenderDone = true;

  attachGlobalScrollHandlers(lpPathContainer);
}
// =========================================================
// SCROLL-SPY
// =========================================================

function updateScrollSpyActive() {
  if (!lpCardElements.length || !lpSpyContainer) return;

  const scrollArea = document.querySelector(".lp-main-area");
  const mid = scrollArea.clientHeight / 2;

  let bestIdx = -1;
  let bestDist = Infinity;

  lpCardElements.forEach((card, idx) => {
    const rect = card.getBoundingClientRect();
    const containerRect = scrollArea.getBoundingClientRect();
    const center = (rect.top - containerRect.top) + rect.height / 2;
    const dist = Math.abs(center - mid);

    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  });

  if (bestIdx === -1) return;

  const activeNode = lpNodes[bestIdx];
  if (!activeNode) return;

  const key = getNodeKey(activeNode);

  lpSpyContainer.querySelectorAll(".lp-spy-item").forEach(item => {
    item.classList.toggle("active", item.dataset.key === key);
  });

  const activeItem = lpSpyContainer.querySelector(".lp-spy-item.active");
  if (activeItem) {
    const containerHeight = lpSpyContainer.clientHeight;
    const itemRect = activeItem.getBoundingClientRect();
    const containerRect = lpSpyContainer.getBoundingClientRect();
    const itemCenter = (itemRect.top - containerRect.top) + itemRect.height / 2;
    const targetScroll = itemCenter - containerHeight / 2;

    lpSpyContainer.scrollTo({
      top: lpSpyContainer.scrollTop + targetScroll,
      behavior: "smooth"
    });
  }
}

// =========================================================
// ARROWS
// =========================================================

function ensureArrowLayer(root) {
  let layer = root.querySelector(".lp-arrow-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "lp-arrow-layer";
    root.appendChild(layer);
  }
  return layer;
}

function drawArrows(root) {
  const layer = ensureArrowLayer(root);
  layer.innerHTML = "";

  if (!lpCardElements.length) return;

  for (let i = 0; i < lpCardElements.length - 1; i++) {
    const from = lpCardElements[i];
    const to = lpCardElements[i+1];
    if (!from || !to) continue;

    const containerRect = root.getBoundingClientRect();
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    const x = fromRect.left + fromRect.width/2 - containerRect.left;
    const y1 = fromRect.bottom - containerRect.top;
    const y2 = toRect.top - containerRect.top;

    const length = y2 - y1;
    if (length <= 0) continue;

    const line = document.createElement("div");
    line.className = "lp-arrow";
    line.style.width = `${length}px`;
    line.style.transform = `translate(${x}px, ${y1}px) rotate(90deg)`;

    layer.appendChild(line);
  }
}

// =========================================================
// GLOBAL SCROLL HANDLERS
// =========================================================

function attachGlobalScrollHandlers(root) {
  const scrollArea = document.querySelector(".lp-main-area");

  scrollArea.addEventListener("scroll", () => {
    if (isSyncScrolling) return;
    updateScrollSpyActive();
    drawArrows(root);
  });

  // Optional: Sync vom Scrollspy zurück ins Hauptfenster
  // if (lpSpyContainer) {
  //   lpSpyContainer.addEventListener("scroll", () => {
  //     if (isSyncScrolling) return;
  //     syncScrollFromSpy();
  //   });
  // }
}

// =========================================================
// TITEL + DETAILS-OVERLAY (aus deinem Original übernommen)
// =========================================================

function buildTitle(node) {
  return `
    <div class="lp-title-line1">
      <span>Klasse ${node.class}</span>
      ${node.unit ? `<span>– Unit ${node.unit}</span>` : ""}
    </div>
    ${node.sub ? `<div class="lp-title-line2">${node.sub}</div>` : ""}
  `;
}

function openDetails(node, stats, lastTrainText, recommendation) {
  const overlay = document.getElementById("lp-details-overlay");
  const titleEl = document.getElementById("lp-details-title");
  const wordsTab = overlay.querySelector('.lp-details-tab[data-tab="words"]');

  titleEl.innerHTML = buildTitle(node);
  wordsTab.innerHTML = "";

  node.words.forEach(({ w }) => {
    const row = document.createElement("div");
    row.className = "lp-word-row";
    row.innerHTML = `
      <div>${w.translation}</div>
      <div>${w.word}</div>
      <div>${w.example}</div>
      <button class="lp-word-audio">🔊</button>
    `;

    row.querySelector(".lp-word-audio").onclick = () => {
      const u1 = new SpeechSynthesisUtterance(w.translation);
      u1.lang = "de-DE";
      speechSynthesis.speak(u1);

      const u2 = new SpeechSynthesisUtterance(w.word);
      u2.lang = "en-US";
      speechSynthesis.speak(u2);

      const u3 = new SpeechSynthesisUtterance(w.example);
      u3.lang = "en-US";
      speechSynthesis.speak(u3);
    };

    wordsTab.appendChild(row);
  });

  overlay.classList.add("open");
}

// =========================================================
// EXPAND / COLLAPSE (aus deinem Original übernommen)
// =========================================================

function isNodeExpanded(node) {
  if (node.level === "class") return lpExpanded.class.has(node.class);
  if (node.level === "unit") return lpExpanded.unit.has(`${node.class}|${node.unit}`);
  if (node.level === "sub") return lpExpanded.sub.has(`${node.class}|${node.unit}|${node.sub}`);
  return false;
}

function toggleNodeExpand(node) {
  if (node.level === "class") {
    if (lpExpanded.class.has(node.class)) lpExpanded.class.delete(node.class);
    else lpExpanded.class.add(node.class);
  } else if (node.level === "unit") {
    const key = `${node.class}|${node.unit}`;
    if (lpExpanded.unit.has(key)) lpExpanded.unit.delete(key);
    else lpExpanded.unit.add(key);
  } else if (node.level === "sub") {
    const key = `${node.class}|${node.unit}|${node.sub}`;
    if (lpExpanded.sub.has(key)) lpExpanded.sub.delete(key);
    else lpExpanded.sub.add(key);
  }
}

// =========================================================
// EXPORTIERTE Render-Funktion
// =========================================================

export function render() {
  internalRender();
}

// =========================================================
// AUTOMATISCHER START-HOOK
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  if (app) internalRender();
});
