// =========================================================
// start.js – SprachHero V10.1 (final)
// Startscreen + Profilverwaltung + Sprach-Popup + Header-Sync
// =========================================================

import {
  getUsers,
  setUsers,
  getGlobal,
  setGlobal,
  setCurrentUserId
} from "../core/storage.js";

import { updateXpDisplay } from "../core/utils.js";
import { navigate } from "../core/navigation.js";

// =========================================================
// Header-Sprachbutton aktualisieren
// =========================================================

function updateHeaderLanguage() {
  const FLAG_MAP = {
    en: "🇬🇧 EN",
    fr: "🇫🇷 FR",
    es: "🇪🇸 ES",
    it: "🇮🇹 IT",
    la: "🏛️ LA"
  };

  const g = getGlobal();
  const langToggle = document.getElementById("langToggle");

  if (langToggle) {
    langToggle.textContent = `[ ${FLAG_MAP[g.language]} ]`;
  }
}

// =========================================================
// Sprach-Popup nach Profilwahl
// =========================================================

function showLanguagePopup(onSelect) {
  const popup = document.createElement("div");
  popup.className = "lang-popup-start";

  const box = document.createElement("div");
  box.className = "lang-popup-box";
  box.innerHTML = `<h3>Welche Sprache möchtest du lernen?</h3>`;
  popup.appendChild(box);

  const langs = [
    { code: "en", label: "🇬🇧 EN – Englisch" },
    { code: "fr", label: "🇫🇷 FR – Französisch" },
    { code: "es", label: "🇪🇸 ES – Spanisch" },
    { code: "it", label: "🇮🇹 IT – Italienisch" },
    { code: "la", label: "🏛️ LA – Latein" }
  ];

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  box.appendChild(btnRow);

  langs.forEach(l => {
    const btn = document.createElement("button");
    btn.textContent = l.label;
    btn.className = "btn-secondary";

    btn.onclick = () => {
      const g = getGlobal();
      g.language = l.code;
      setGlobal(g);

      updateHeaderLanguage(); // ⭐ Header sofort aktualisieren

      document.body.removeChild(popup);
      onSelect();
    };

    btnRow.appendChild(btn);
  });

  const cancel = document.createElement("button");
  cancel.textContent = "Abbrechen";
  cancel.className = "btn-text";
  cancel.onclick = () => document.body.removeChild(popup);
  box.appendChild(cancel);

  document.body.appendChild(popup);
}

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

// =========================================================
// RENDER STARTSCREEN
// =========================================================

export function render() {
  const app = document.getElementById("app");
  const mainNav = document.getElementById("mainNav");

  app.classList.add("startscreen-animate");
  document.getElementById("xpDisplay").textContent = "Kein Nutzer ausgewählt";

  if (mainNav) mainNav.style.display = "none";

  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  const h2 = document.createElement("h2");
  h2.textContent = "Willkommen bei SprachHero";
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "Wähle ein Profil aus oder lege ein neues an.";
  card.appendChild(p);

  // Nutzerliste
  const users = getUsers();
  const userList = document.createElement("div");
  userList.className = "user-list";

  users.forEach(u => {
    const uc = document.createElement("div");
    uc.className = "user-card";

    uc.onclick = () => {
      setCurrentUserId(u.id);

      showLanguagePopup(() => {
        updateXpDisplay();
        updateHeaderLanguage(); // ⭐ Header aktualisieren
        if (mainNav) mainNav.style.display = "flex";
        app.classList.remove("startscreen-animate");
        navigate("learn"); // ⭐ Start → Lernen
      });
    };

    const av = document.createElement("span");
    av.className = "avatar";
    av.textContent = u.avatar || "🙂";
    uc.appendChild(av);

    const nameBox = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = u.name;
    nameBox.appendChild(name);
    uc.appendChild(nameBox);

    userList.appendChild(uc);
  });

  if (users.length === 0) {
    const info = document.createElement("p");
    info.className = "small";
    info.textContent = "Noch keine Profile vorhanden. Lege unten ein neues Profil an.";
    card.appendChild(info);
  }

  card.appendChild(userList);

  // Profil anlegen
  const hr = document.createElement("hr");
  hr.style.margin = "16px 0";
  card.appendChild(hr);

  const h3 = document.createElement("h3");
  h3.textContent = "Neues Profil anlegen";
  card.appendChild(h3);

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Name:";
  card.appendChild(nameLabel);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  card.appendChild(nameInput);

  const avatarLabel = document.createElement("label");
  avatarLabel.textContent = "Avatar:";
  card.appendChild(avatarLabel);

  const avatarGrid = document.createElement("div");
  avatarGrid.className = "avatar-grid";

  let selectedAvatar = "🙂";

  const allAvatars = [
    ...avatarSets.emoji,
    ...avatarSets.comic,
    ...avatarSets.minimal,
    ...avatarSets.cyberpunk,
    ...avatarSets.animals
  ];

  allAvatars.forEach(av => {
    const el = document.createElement("div");
    el.className = "avatar-choice";
    el.textContent = av;

    if (av === selectedAvatar) el.classList.add("selected");

    el.onclick = () => {
      selectedAvatar = av;
      avatarGrid.querySelectorAll(".avatar-choice").forEach(a => a.classList.remove("selected"));
      el.classList.add("selected");
    };

    avatarGrid.appendChild(el);
  });

  card.appendChild(avatarGrid);

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  card.appendChild(btnRow);

  const createBtn = document.createElement("button");
  createBtn.textContent = "Profil erstellen";
  createBtn.className = "btn-primary";
  btnRow.appendChild(createBtn);

  createBtn.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert("Bitte einen Namen eingeben.");
      return;
    }

    const users = getUsers();
    const id = "u_" + Date.now();

    users.push({
      id,
      name,
      avatar: selectedAvatar,
      languages: []
    });

    setUsers(users);
    setCurrentUserId(id);

    showLanguagePopup(() => {
      updateXpDisplay();
      updateHeaderLanguage(); // ⭐ Header aktualisieren
      if (mainNav) mainNav.style.display = "flex";
      app.classList.remove("startscreen-animate");
      navigate("learn"); // ⭐ Start → Lernen
    });
  };

  app.appendChild(card);
}
