// =========================================================
// Bestehender Code
// =========================================================

export function showToast(text) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    container.appendChild(t);

    setTimeout(() => t.remove(), 3000);
}

export function showAchievementToast(key) {
    const pretty = key.replace(/_/g, " ");
    showToast("🎉 Achievement freigeschaltet: " + pretty);
}

// =========================================================
// NEU: Quest-Toast
// =========================================================

export function showQuestToast(id) {
    const pretty = id.replace(/_/g, " ");
    showToast("🟢 Quest abgeschlossen: " + pretty);
}

// =========================================================
// NEU: Boost-Toast
// =========================================================

export function showBoostToast(multiplier) {
    showToast(`🔥 XP-Boost aktiviert: ${multiplier}× XP`);
}
