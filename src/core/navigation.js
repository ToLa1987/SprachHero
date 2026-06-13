// =========================================================
// navigation.js – SprachHero V10.1 (Fix für doppelte Navigation)
// =========================================================

export function navigate(page) {

    const app = document.getElementById("app");
    const mainNav = document.getElementById("mainNav");

    // Learn-Modus stoppen
    if (window.globalAudioAbort) window.globalAudioAbort();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window.autoRunning = false;
    clearTimeout(window.autoTimer);
    window.currentLearnSessionId = "stopped_" + Math.random();

    // Page-Klassen
    const pageClassMap = {
        start: "start-page",
        learn: "learn-page",
        trainer: "trainer-page",
        dashboard: "dashboard-page",
        story: "story-page",
        badges: "badges-page",
        quests: "quests-page",
        learningpath: "learningpath-page",
        settings: "settings-page"
    };

    document.body.classList.remove(
        "start-page","learn-page","trainer-page","dashboard-page",
        "story-page","badges-page","quests-page","learningpath-page","settings-page"
    );

    const cls = pageClassMap[page];
    if (cls) document.body.classList.add(cls);

    // Navigation aktiv setzen
    if (mainNav) {
        mainNav.querySelectorAll("button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.page === page);
        });
    }

    // Startseite: Navigation ausblenden
    if (page === "start") {
        if (mainNav) mainNav.style.display = "none";
        document.getElementById("xpDisplay").textContent = "Kein Nutzer ausgewählt";
        import("../pages/start.js").then(m => m.render());
        return;
    }

    // Andere Seiten: Navigation einblenden
    if (mainNav) mainNav.style.display = "flex";

    // Dynamisches Laden
    switch (page) {
        case "learn": import("../pages/learn.js").then(m => m.render()); break;
        case "trainer": import("../pages/trainer.js").then(m => m.render()); break;
        case "dashboard": import("../pages/dashboard.js").then(m => m.render()); break;
        case "story": import("../story/story.js").then(m => m.render()); break;
        case "badges": import("../pages/badges.js").then(m => m.render()); break;
        case "quests": import("../pages/quests.js").then(m => m.render()); break;
        case "learningpath": import("../pages/learningpath.js").then(m => m.render()); break;
        case "settings": import("../pages/settings.js").then(m => m.render()); break;
        default: app.innerHTML = "<p>Unbekannte Seite.</p>";
    }

    // ⭐ RICHTIG: Event am Ende der Funktion
    document.dispatchEvent(new Event("navigation-updated"));
}



// =========================================================
// MOBILE DROPDOWN NAVIGATION – FIXED (V10.2)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const toggle = document.getElementById("mobileNavToggle");
    const dropdown = document.getElementById("mobileNavDropdown");

    if (!toggle || !dropdown) return;

    function rebuildMobileMenu() {
        dropdown.innerHTML = "";

        const navButtons = document.querySelectorAll("#mainNav .nav-inner button");

        navButtons.forEach(btn => {
            const clone = btn.cloneNode(true);
clone.onclick = () => {
    dropdown.style.display = "none";   // Menü SOFORT schließen
    navigate(clone.dataset.page);      // Dann Seite wechseln
};

            dropdown.appendChild(clone);
        });
    }

    // Menü beim Start einmal aufbauen
    rebuildMobileMenu();

    // Menü nach jedem Seitenwechsel neu aufbauen
    document.addEventListener("navigation-updated", rebuildMobileMenu);

toggle.onclick = () => {
    dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
};

});

