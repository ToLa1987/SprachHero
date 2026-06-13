// =========================================================
// /src/pages/settings.js – SprachHero V14.0 (FINAL)
// GitHubCSV + OfflineCache + IDFixes + asyncFixes
// =========================================================

import {
  getCurrentUser,
  getUsers,
  setUsers,
  getGlobal,
  setGlobal,
  getWordsForLang,
  setWordsForLang
} from "../core/storage.js";

import { updateXpDisplay } from "../core/utils.js";

// =========================================================
// Avatar-Sets
// =========================================================

const avatarSets = {
  emoji: ["🙂","😎","🤓","🧠","😁","😇","🤠","😺","😼","😻","🐱","🐶","🐼","🐧","🐢"],
  comic: ["🦸‍♂️","🦸‍♀️","🦹‍♂️","🦹‍♀️","🧙‍♂️","🧙‍♀️","🧛‍♂️","🧛‍♀️","🧝‍♂️","🧝‍♀️","🧞‍♂️","🧞‍♀️","🧟‍♂️","🧟‍♀️","🧚‍♀️"],
  minimal: ["🔵","🟣","🟢","🟡","🔴","⚫","⚪","🟤","⭐","✨","📘","📗","📙","📕","📝"],
  cyberpunk: ["🤖","👾","🛸","💿","🔮","⚡","🧬","🛰️","🌐","💠","🟪","🟦","🟩","🟥","🟧"],
  animals: ["🦊","🐺","🐯","🦁","🐵","🐸","🐙","🦉","🦄","🐨","🐰","🐻","🐢","🐬","🦕"]
};

const ALL_LANGS = ["en", "fr", "es", "it", "la"];

const LANG_LABELS = {
  en: "EN – Englisch 🇬🇧",
  fr: "FR – Französisch 🇫🇷",
  es: "ES – Spanisch 🇪🇸",
  it: "IT – Italienisch 🇮🇹",
  la: "LA – Latein 🏛️"
};

// =========================================================
// TEMP UI STATE (Fix für tempTheme-Fehler)
// =========================================================

let tempTheme = getGlobal().theme || "default";
let tempFontSize = getGlobal().fontSize || "medium";
let tempFontFamily = getGlobal().fontFamily || "segoe";
let tempSpacing = getGlobal().spacing || "comfortable";
let tempAnimations = getGlobal().animations || "on";

// =========================================================
// RENDER
// =========================================================

export async function render() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  if (!user) {
    import("./start.js").then(m => m.render());
    return;
  }

  app.innerHTML = `<div id="settings-page" class="settings-page"></div>`;
  const page = document.getElementById("settings-page");

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>Einstellungen</h2>`;
  page.appendChild(card);

  // =========================================================
  // PROFIL
  // =========================================================

  const accProfile = createAccordion("👤 Profil", false);
  card.appendChild(accProfile.wrapper);

  accProfile.body.innerHTML = `
    <div class="profile-row">
      <strong>Profil:</strong> ${user.name}
    </div>
    <label>Avatar auswählen:</label>
    <div class="avatar-grid"></div>
  `;

  const avatarGrid = accProfile.body.querySelector(".avatar-grid");
  const allAvatars = [
    ...avatarSets.emoji,
    ...avatarSets.comic,
    ...avatarSets.minimal,
    ...avatarSets.cyberpunk,
    ...avatarSets.animals
  ];

  const currentAvatar = user.avatar || "🙂";

  allAvatars.forEach(av => {
    const btn = document.createElement("button");
    btn.className = "avatar-option";
    btn.textContent = av;
    if (av === currentAvatar) btn.classList.add("active");

    btn.onclick = () => {
      const users = getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      users[idx].avatar = av;
      setUsers(users);

      avatarGrid.querySelectorAll(".avatar-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateXpDisplay();
    };

    avatarGrid.appendChild(btn);
  });

  // =========================================================
  // ZIELE
  // =========================================================

  const g = getGlobal();
  const accGoals = createAccordion("🎯 Ziele");
  card.appendChild(accGoals.wrapper);

  accGoals.body.innerHTML = `
    <label>Tagesziel (XP):</label>
    <input id="goal-daily" type="number">
    <label>Wochenziel (XP):</label>
    <input id="goal-weekly" type="number">
    <label>Monatsziel (XP):</label>
    <input id="goal-monthly" type="number">
    <button id="save-goals" class="primary-btn">Speichern</button>
  `;

  accGoals.body.querySelector("#goal-daily").value = g.dailyGoal || 30;
  accGoals.body.querySelector("#goal-weekly").value = g.weeklyGoal || 150;
  accGoals.body.querySelector("#goal-monthly").value = g.monthlyGoal || 600;

  accGoals.body.querySelector("#save-goals").onclick = () => {
    const gg = getGlobal();
    gg.dailyGoal = Number(accGoals.body.querySelector("#goal-daily").value);
    gg.weeklyGoal = Number(accGoals.body.querySelector("#goal-weekly").value);
    gg.monthlyGoal = Number(accGoals.body.querySelector("#goal-monthly").value);
    setGlobal(gg);
    alert("Ziele gespeichert.");
  };

  // =========================================================
  // UI-PERSONALISIERUNG + LIVE-PREVIEW
  // =========================================================

  const accUI = createAccordion("🎨 Darstellung & UI");
  card.appendChild(accUI.wrapper);

  accUI.body.innerHTML = `
    <div class="ui-layout">
      <div class="ui-left">
        <div class="ui-section">
          <h4>Theme</h4>
          <div class="ui-btn-grid">
            <button class="secondary-btn ui-theme-btn" data-value="default">Standard</button>
            <button class="secondary-btn ui-theme-btn" data-value="green">Grün</button>
            <button class="secondary-btn ui-theme-btn" data-value="purple">Lila</button>
            <button class="secondary-btn ui-theme-btn" data-value="highcontrast">High Contrast</button>
          </div>
        </div>

        <div class="ui-section">
          <h4>Schriftgröße</h4>
          <div class="ui-btn-grid">
            <button class="secondary-btn ui-fontsize-btn" data-value="small">Klein</button>
            <button class="secondary-btn ui-fontsize-btn" data-value="medium">Mittel</button>
            <button class="secondary-btn ui-fontsize-btn" data-value="large">Groß</button>
          </div>
        </div>

        <div class="ui-section">
          <h4>Schriftart</h4>
          <div class="ui-btn-grid">
            <button class="secondary-btn ui-fontfamily-btn" data-value="segoe">Segoe UI</button>
            <button class="secondary-btn ui-fontfamily-btn" data-value="inter">Inter</button>
            <button class="secondary-btn ui-fontfamily-btn" data-value="roboto">Roboto</button>
            <button class="secondary-btn ui-fontfamily-btn" data-value="opensans">Open Sans</button>
          </div>
        </div>

        <div class="ui-section">
          <h4>Abstände</h4>
          <div class="ui-btn-grid">
            <button class="secondary-btn ui-spacing-btn" data-value="compact">Kompakt</button>
            <button class="secondary-btn ui-spacing-btn" data-value="comfortable">Standard</button>
            <button class="secondary-btn ui-spacing-btn" data-value="spacious">Großzügig</button>
          </div>
        </div>

        <div class="ui-section">
          <h4>Animationen</h4>
          <div class="ui-btn-grid">
            <button class="secondary-btn ui-anim-btn" data-value="on">An</button>
            <button class="secondary-btn ui-anim-btn" data-value="off">Aus</button>
          </div>
        </div>

        <button class="primary-btn ui-apply-btn" id="ui-apply">Änderungen übernehmen</button>
        <button class="secondary-btn ui-reset-btn" id="ui-reset">Auf Standard zurücksetzen</button>
      </div>

      <div id="ui-preview" class="ui-preview">
        <h4>Vorschau</h4>
        <div class="preview-card preview-title">Titel</div>
        <div class="preview-card preview-button">Button</div>
        <div class="preview-card preview-cardbox">Karte</div>
      </div>
    </div>
  `;

  const previewEl = accUI.body.querySelector("#ui-preview");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const g = getGlobal();
    g.theme = theme;
    setGlobal(g);
  }

  function setFontSize(size) {
    document.documentElement.setAttribute("data-fontsize", size);
    const g = getGlobal();
    g.fontSize = size;
    setGlobal(g);
  }

  function setFontFamily(family) {
    document.documentElement.setAttribute("data-fontfamily", family);
    const g = getGlobal();
    g.fontFamily = family;
    setGlobal(g);
  }

  function setSpacing(spacing) {
    document.documentElement.setAttribute("data-spacing", spacing);
    const g = getGlobal();
    g.spacing = spacing;
    setGlobal(g);
  }

  function setAnimations(anim) {
    document.documentElement.setAttribute("data-animations", anim);
    const g = getGlobal();
    g.animations = anim;
    setGlobal(g);
  }

  function updatePreview() {
    previewEl.setAttribute("data-theme", tempTheme);
    previewEl.setAttribute("data-fontsize", tempFontSize);
    previewEl.setAttribute("data-fontfamily", tempFontFamily);
    previewEl.setAttribute("data-spacing", tempSpacing);
    previewEl.setAttribute("data-animations", tempAnimations);
  }

  accUI.body.querySelectorAll(".ui-theme-btn").forEach(btn => {
    btn.onclick = () => {
      tempTheme = btn.dataset.value;
      activateButtons(".ui-theme-btn", tempTheme);
      updatePreview();
    };
  });

  accUI.body.querySelectorAll(".ui-fontsize-btn").forEach(btn => {
    btn.onclick = () => {
      tempFontSize = btn.dataset.value;
      activateButtons(".ui-fontsize-btn", tempFontSize);
      updatePreview();
    };
  });

  accUI.body.querySelectorAll(".ui-fontfamily-btn").forEach(btn => {
    btn.onclick = () => {
      tempFontFamily = btn.dataset.value;
      activateButtons(".ui-fontfamily-btn", tempFontFamily);
      updatePreview();
    };
  });

  accUI.body.querySelectorAll(".ui-spacing-btn").forEach(btn => {
    btn.onclick = () => {
      tempSpacing = btn.dataset.value;
      activateButtons(".ui-spacing-btn", tempSpacing);
      updatePreview();
    };
  });

  accUI.body.querySelectorAll(".ui-anim-btn").forEach(btn => {
    btn.onclick = () => {
      tempAnimations = btn.dataset.value;
      activateButtons(".ui-anim-btn", tempAnimations);
      updatePreview();
    };
  });

  accUI.body.querySelector("#ui-apply").onclick = () => {
    setTheme(tempTheme);
    setFontSize(tempFontSize);
    setFontFamily(tempFontFamily);
    setSpacing(tempSpacing);
    setAnimations(tempAnimations);
    alert("Darstellung aktualisiert.");
  };

  accUI.body.querySelector("#ui-reset").onclick = () => {
    tempTheme = "default";
    tempFontSize = "medium";
    tempFontFamily = "segoe";
    tempSpacing = "comfortable";
    tempAnimations = "on";

    applySavedUiPreferences();
    alert("Darstellung zurückgesetzt.");
  };

  // =========================================================
  // CSV + EDITOR
  // =========================================================

  const accCsv = createAccordion("📂 Daten & CSV");
  card.appendChild(accCsv.wrapper);

  for (const lang of ALL_LANGS) {
    const words = await getWordsForLang(lang);
    const count = words.length;

    const sub = createAccordion(`${LANG_LABELS[lang]} (${count} Wörter)`);
    accCsv.body.appendChild(sub.wrapper);

    sub.body.innerHTML = `
      <p><strong>CSV-Import/Export</strong></p>
      <input type="file" class="csv-file" accept=".csv">
      <div class="btn-row">
        <button class="secondary-btn secondary-small btn-import">Importieren</button>
        <button class="secondary-btn secondary-small btn-export">Exportieren</button>
        <button class="secondary-btn secondary-small btn-delete">Alle löschen</button>
      </div>
      <hr>
      <p><strong>Vokabel-Editor</strong></p>
      <div id="editor-${lang}"></div>
    `;

    const fileInput = sub.body.querySelector(".csv-file");
    const importBtn = sub.body.querySelector(".btn-import");
    const exportBtn = sub.body.querySelector(".btn-export");
    const deleteBtn = sub.body.querySelector(".btn-delete");
    const editorContainer = sub.body.querySelector(`#editor-${lang}`);

    importBtn.onclick = () => {
      const file = fileInput.files?.[0];
      if (!file) return alert("Bitte eine CSV-Datei auswählen.");

      const replace = confirm("Bestehende Vokabeln dieser Sprache löschen?");
      const reader = new FileReader();

      reader.onload = async (e) => {
        const lines = String(e.target.result)
          .split("\n")
          .map(l => l.replace(/\r$/, ""))
          .filter(l => l.trim().length > 0);

        const imported = lines.map(line => {
          const [id, cl, un, subc, w, t, ex] = parseCsvLine(line);
          return {
            id: (id || "").trim() || crypto.randomUUID(),
            class: (cl || "").trim(),
            unit: (un || "").trim(),
            subcategory: (subc || "").trim(),
            word: (w || "").trim(),
            translation: (t || "").trim(),
            example: (ex || "").trim()
          };
        });

        const existing = replace ? [] : await getWordsForLang(lang);
        const merged = existing.concat(imported);
        setWordsForLang(lang, merged);

        alert(`Importiert: ${imported.length} – Gesamt: ${merged.length}`);
        renderEditor(lang, editorContainer);
        sub.header.querySelector("span").innerText =
          `${LANG_LABELS[lang]} (${merged.length} Wörter)`;
      };

      reader.readAsText(file, "UTF-8");
    };

    exportBtn.onclick = async () => {
      const words = await getWordsForLang(lang);
      const csv = words
        .map(w => [
          w.id,
          w.class,
          w.unit,
          w.subcategory,
          w.word,
          w.translation,
          w.example
        ].join(";"))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sprachhero_${lang}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    deleteBtn.onclick = async () => {
      if (!confirm("Alle Vokabeln löschen?")) return;
      setWordsForLang(lang, []);
      renderEditor(lang, editorContainer);
      sub.header.querySelector("span").innerText =
        `${LANG_LABELS[lang]} (0 Wörter)`;
    };

    renderEditor(lang, editorContainer);
  }

  applySavedUiPreferences();
}

// =========================================================
// EDITOR
// =========================================================

async function renderEditor(lang, container) {
  const words = await getWordsForLang(lang);

  container.innerHTML = `
    <table class="vocab-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Vokabel</th>
          <th>Übersetzung</th>
          <th>Beispiel</th>
          <th>Klasse</th>
          <th>Unit</th>
          <th>Unterkapitel</th>
          <th>Löschen</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const tbody = container.querySelector("tbody");

  words.forEach((w, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${w.id}</td>
      <td><input value="${w.word}"></td>
      <td><input value="${w.translation}"></td>
      <td><input value="${w.example}"></td>
      <td><input value="${w.class}"></td>
      <td><input value="${w.unit}"></td>
      <td><input value="${w.subcategory}"></td>
      <td><button class="secondary-btn secondary-small">Löschen</button></td>
    `;

    const inputs = tr.querySelectorAll("input");
    const del = tr.querySelector("button");

    inputs.forEach((inp, i) => {
      inp.onchange = async () => {
        const updated = await getWordsForLang(lang);
        if (!updated[idx]) return;

        if (i === 0) updated[idx].word = inp.value;
        if (i === 1) updated[idx].translation = inp.value;
        if (i === 2) updated[idx].example = inp.value;
        if (i === 3) updated[idx].class = inp.value;
        if (i === 4) updated[idx].unit = inp.value;
        if (i === 5) updated[idx].subcategory = inp.value;

        setWordsForLang(lang, updated);
      };
    });

    del.onclick = async () => {
      const updated = await getWordsForLang(lang);
      updated.splice(idx, 1);
      setWordsForLang(lang, updated);
      renderEditor(lang, container);
    };

    tbody.appendChild(tr);
  });

  const addRow = document.createElement("tr");
  addRow.innerHTML = `
    <td>neu</td>
    <td><input placeholder="Vokabel"></td>
    <td><input placeholder="Übersetzung"></td>
    <td><input placeholder="Beispiel"></td>
    <td><input placeholder="Klasse"></td>
    <td><input placeholder="Unit"></td>
    <td><input placeholder="Unterkapitel"></td>
    <td><button class="primary-btn secondary-small">+</button></td>
  `;

  const addInputs = addRow.querySelectorAll("input");
  const addBtn = addRow.querySelector("button");

  addBtn.onclick = async () => {
    const [w, t, ex, cl, un, sub] = [...addInputs].map(i => i.value.trim());
    if (!w && !t) return alert("Mindestens Vokabel oder Übersetzung angeben.");

    const updated = await getWordsForLang(lang);
    updated.push({
      id: crypto.randomUUID(),
      word: w,
      translation: t,
      example: ex,
      class: cl,
      unit: un,
      subcategory: sub
    });

    setWordsForLang(lang, updated);
    renderEditor(lang, container);
  };

  tbody.appendChild(addRow);
}

// =========================================================
// ACCORDION
// =========================================================

function createAccordion(title, open = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "accordion";

  const header = document.createElement("div");
  header.className = "accordion-header";
  header.innerHTML = `<span>${title}</span><span>${open ? "▼" : "▶"}</span>`;

  const body = document.createElement("div");
  body.className = "accordion-body";
  body.style.display = open ? "block" : "none";

  header.onclick = () => {
    const visible = body.style.display !== "none";
    body.style.display = visible ? "none" : "block";
    header.lastChild.textContent = visible ? "▶" : "▼";
  };

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return { wrapper, header, body };
}

// =========================================================
// CSV-PARSER
// =========================================================

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

// =========================================================
// UI-Helfer
// =========================================================

function activateButtons(selector, value) {
  document.querySelectorAll(selector).forEach(btn => {
    if (btn.dataset.value === value) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

function updatePreview() {
  const previewEl = document.getElementById("ui-preview");
  if (!previewEl) return;

  previewEl.setAttribute("data-theme", tempTheme);
  previewEl.setAttribute("data-fontsize", tempFontSize);
  previewEl.setAttribute("data-fontfamily", tempFontFamily);
  previewEl.setAttribute("data-spacing", tempSpacing);
  previewEl.setAttribute("data-animations", tempAnimations);
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const g = getGlobal();
  g.theme = theme;
  setGlobal(g);
}

function setFontSize(size) {
  document.documentElement.setAttribute("data-fontsize", size);
  const g = getGlobal();
  g.fontSize = size;
  setGlobal(g);
}

function setFontFamily(family) {
  document.documentElement.setAttribute("data-fontfamily", family);
  const g = getGlobal();
  g.fontFamily = family;
  setGlobal(g);
}

function setSpacing(spacing) {
  document.documentElement.setAttribute("data-spacing", spacing);
  const g = getGlobal();
  g.spacing = spacing;
  setGlobal(g);
}

function setAnimations(anim) {
  document.documentElement.setAttribute("data-animations", anim);
  const g = getGlobal();
  g.animations = anim;
  setGlobal(g);
}


function applySavedUiPreferences() {
  activateButtons(".ui-theme-btn", tempTheme);
  activateButtons(".ui-fontsize-btn", tempFontSize);
  activateButtons(".ui-fontfamily-btn", tempFontFamily);
  activateButtons(".ui-spacing-btn", tempSpacing);
  activateButtons(".ui-anim-btn", tempAnimations);

  updatePreview();

  setTheme(tempTheme);
  setFontSize(tempFontSize);
  setFontFamily(tempFontFamily);
  setSpacing(tempSpacing);
  setAnimations(tempAnimations);
}
