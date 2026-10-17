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

const ALL_LANGS = ["en", "fr", "es", "it", "la", "pt", "ru"];

const LANG_LABELS = {
  en: "EN – Englisch 🇬🇧",
  fr: "FR – Französisch 🇫🇷",
  es: "ES – Spanisch 🇪🇸",
  it: "IT – Italienisch 🇮🇹",
  la: "LA – Latein 🏛️",
  pt: "PT – Portugiesisch 🇵🇹",
  ru: "RU – Russisch 🇷🇺"
};

const PROFILE_BACKUP_FORMAT = "sprachhero-profile-backup";
const USER_SCOPED_STORAGE = {
  progress: "sprachhero_progress_v7",
  xpHistory: "sprachhero_xp_history_v7",
  storyProgress: "sprachhero_story_progress_v2",
  achievements: "sprachhero_achievements_v2",
  storySpeed: "sprachhero_story_speed_v1",
  storyStreak: "sprachhero_story_streak_v1"
};

function readStorageObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function createProfileBackup(user) {
  const userId = user.id;
  const scoped = Object.fromEntries(
    Object.entries(USER_SCOPED_STORAGE).map(([name, key]) => [name, readStorageObject(key)[userId] ?? {}])
  );
  const globalSettings = getGlobal();
  const learnStates = {};
  const learnPrefix = `learn_state_${userId}_`;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(learnPrefix)) {
      learnStates[key.slice(learnPrefix.length)] = localStorage.getItem(key);
    }
  }

  return {
    format: PROFILE_BACKUP_FORMAT,
    version: 1,
    createdAt: new Date().toISOString(),
    profile: {
      id: userId,
      name: user.name,
      avatar: user.avatar || "🙂",
      languages: Array.isArray(user.languages) ? user.languages : [],
      storyAchievements: user.storyAchievements || {}
    },
    data: {
      ...scoped,
      quests: readStorageObject(`quests_${userId}`),
      learningStreak: globalSettings.streaks?.[userId] || { current: 0, best: 0 },
      learnStates
    }
  };
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isValidProfileBackup(backup) {
  return backup?.format === PROFILE_BACKUP_FORMAT && backup.version === 1 &&
    typeof backup.profile?.id === "string" && typeof backup.profile?.name === "string" &&
    isRecord(backup.data) && isRecord(backup.data.progress) &&
    isRecord(backup.data.xpHistory) && isRecord(backup.data.storyProgress) &&
    isRecord(backup.data.achievements) && (Array.isArray(backup.data.storySpeed) || isRecord(backup.data.storySpeed)) &&
    isRecord(backup.data.storyStreak) && isRecord(backup.data.quests) &&
    isRecord(backup.data.learningStreak) && isRecord(backup.data.learnStates);
}

function restoreProfileBackup(backup, activeUser) {
  const targetId = activeUser.id;
  const updates = new Map();
  const fields = {
    progress: USER_SCOPED_STORAGE.progress,
    xpHistory: USER_SCOPED_STORAGE.xpHistory,
    storyProgress: USER_SCOPED_STORAGE.storyProgress,
    achievements: USER_SCOPED_STORAGE.achievements,
    storySpeed: USER_SCOPED_STORAGE.storySpeed,
    storyStreak: USER_SCOPED_STORAGE.storyStreak
  };

  Object.entries(fields).forEach(([name, key]) => {
    const all = readStorageObject(key);
    all[targetId] = backup.data[name];
    updates.set(key, JSON.stringify(all));
  });
  updates.set(`quests_${targetId}`, JSON.stringify(backup.data.quests));

  const globalSettings = getGlobal();
  globalSettings.streaks = globalSettings.streaks || {};
  globalSettings.streaks[targetId] = backup.data.learningStreak;
  updates.set("sprachhero_global_v7", JSON.stringify(globalSettings));

  const users = getUsers();
  const userIndex = users.findIndex(entry => entry.id === targetId);
  if (userIndex >= 0) {
    users[userIndex] = {
      ...users[userIndex],
      name: backup.profile.name,
      avatar: backup.profile.avatar || "🙂",
      languages: Array.isArray(backup.profile.languages) ? backup.profile.languages : [],
      storyAchievements: isRecord(backup.profile.storyAchievements) ? backup.profile.storyAchievements : {}
    };
  }
  updates.set("sprachhero_users", JSON.stringify(users));

  const learnPrefix = `learn_state_${targetId}_`;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(learnPrefix)) updates.set(key, null);
  }
  Object.entries(backup.data.learnStates).forEach(([lang, value]) => {
    if (!/^[a-z]{2,3}$/i.test(lang) || typeof value !== "string") return;
    try {
      JSON.parse(value);
      updates.set(`${learnPrefix}${lang}`, value);
    } catch {
      // Ungültige optionale Lernansichten überspringen; übriger Fortschritt bleibt gültig.
    }
  });

  const previousValues = new Map([...updates.keys()].map(key => [key, localStorage.getItem(key)]));
  try {
    updates.forEach((value, key) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
  } catch (error) {
    previousValues.forEach((value, key) => {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        // Keep restoring remaining keys if browser storage is exhausted.
      }
    });
    throw error;
  }
}

function safeFileName(name) {
  return String(name || "profil")
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "profil";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

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

  const backupPanel = document.createElement("section");
  backupPanel.className = "profile-backup-panel";
  backupPanel.innerHTML = `
    <h4>Datensicherung für dieses Profil</h4>
    <p class="small">Die Sicherung wird als Datei auf dein Gerät heruntergeladen. Sie enthält nur das aktuell geöffnete Profil und dessen Fortschritt. Es werden keine Daten hochgeladen.</p>
    <div class="btn-row">
      <button type="button" class="secondary-btn profile-backup-export">Sicherung herunterladen</button>
      <button type="button" class="secondary-btn profile-backup-import">Sicherung wiederherstellen</button>
      <input type="file" class="profile-backup-file" accept="application/json,.json" hidden>
    </div>
  `;
  accProfile.body.appendChild(backupPanel);

  backupPanel.querySelector(".profile-backup-export").onclick = () => {
    const backup = createProfileBackup(user);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sprachhero-${safeFileName(user.name)}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const backupFile = backupPanel.querySelector(".profile-backup-file");
  backupPanel.querySelector(".profile-backup-import").onclick = () => backupFile.click();
  backupFile.onchange = async () => {
    const file = backupFile.files?.[0];
    backupFile.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Die Sicherungsdatei ist größer als 10 MB.");
      return;
    }

    try {
      const backup = JSON.parse(await file.text());
      const activeUser = getCurrentUser();
      if (!activeUser || !isValidProfileBackup(backup)) {
        alert("Diese Datei ist keine gültige SprachHero-Profilsicherung.");
        return;
      }

      const confirmed = confirm(
        `Die Sicherung von „${backup.profile.name}“ wird in das aktuell geöffnete Profil „${activeUser.name}“ eingespielt. ` +
        "Dabei werden nur die Daten dieses Profils ersetzt. Andere Profile bleiben unverändert. Fortfahren?"
      );
      if (!confirmed) return;

      restoreProfileBackup(backup, activeUser);
      alert("Das Profil wurde aus der lokalen Sicherungsdatei wiederhergestellt.");
      await render();
    } catch (error) {
      console.error("Profilsicherung konnte nicht wiederhergestellt werden:", error);
      alert("Die Sicherungsdatei konnte nicht gelesen werden. Es wurden keine Profildaten geändert.");
    }
  };

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
    let editorContainer;
    let editorLoaded = false;
    const sub = createAccordion(LANG_LABELS[lang], false, async () => {
      if (editorLoaded) return;
      editorLoaded = true;
      try {
        const words = await getWordsForLang(lang);
        sub.header.querySelector("span").textContent = `${LANG_LABELS[lang]} (${words.length} Wörter)`;
        await renderEditor(lang, editorContainer, words);
      } catch (error) {
        editorLoaded = false;
        console.error(`Vokabeleditor für ${lang} konnte nicht geladen werden:`, error);
      }
    });
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
    editorContainer = sub.body.querySelector(`#editor-${lang}`);

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

        const imported = lines
          .filter(line => {
            const trimmed = line.trimStart();
            return trimmed.length > 0 &&
              !trimmed.startsWith("#") &&
              !/^id\s*;/i.test(trimmed);
          })
          .map(line => {
          const columns = parseCsvLine(line);
          const [id] = columns;
          // Existing exports used class-first; GitHub CSVs use word-first.
          const secondColumnIsClass = Number.isFinite(Number(columns[1])) && columns[1]?.trim() !== "";
          const fifthColumnIsClass = Number.isFinite(Number(columns[4])) && columns[4]?.trim() !== "";
          const legacyClassFirst = columns.length > 4 && secondColumnIsClass && !fifthColumnIsClass;
          const [word, translation, example, className, unit, subcategory] = legacyClassFirst
            ? [columns[4], columns[5], columns[6], columns[1], columns[2], columns[3]]
            : [columns[1], columns[2], columns[3], columns[4], columns[5], columns[6]];
          return {
            id: (id || "").trim() || crypto.randomUUID(),
            class: (className || "").trim(),
            unit: (unit || "").trim(),
            subcategory: (subcategory || "").trim(),
            word: (word || "").trim(),
            translation: (translation || "").trim(),
            example: (example || "").trim()
          };
        });

        const existing = replace ? [] : await getWordsForLang(lang);
        const merged = existing.concat(imported);
        setWordsForLang(lang, merged);

        alert(`Importiert: ${imported.length} – Gesamt: ${merged.length}`);
        await renderEditor(lang, editorContainer, merged);
        editorLoaded = true;
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
          w.word,
          w.translation,
          w.example,
          w.class,
          w.unit,
          w.subcategory
        ].map(escapeCsvCell).join(";"))
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
      await renderEditor(lang, editorContainer, []);
      editorLoaded = true;
      sub.header.querySelector("span").innerText =
        `${LANG_LABELS[lang]} (0 Wörter)`;
    };

  }

  applySavedUiPreferences();
}

// =========================================================
// EDITOR
// =========================================================

async function renderEditor(lang, container, suppliedWords = null) {
  const words = suppliedWords || await getWordsForLang(lang);

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
      <td>${escapeHtml(w.id)}</td>
      <td><input value="${escapeHtml(w.word)}"></td>
      <td><input value="${escapeHtml(w.translation)}"></td>
      <td><input value="${escapeHtml(w.example)}"></td>
      <td><input value="${escapeHtml(w.class)}"></td>
      <td><input value="${escapeHtml(w.unit)}"></td>
      <td><input value="${escapeHtml(w.subcategory)}"></td>
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

function createAccordion(title, open = false, onOpen = null) {
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
    if (!visible && onOpen) onOpen();
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

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
