// =========================================================
// XP FLY ANIMATION – Quest Engine V1
// =========================================================

export function xpFlyAnimation(button, xp) {
  const rect = button.getBoundingClientRect();

  const el = document.createElement("div");
  el.className = "xp-fly";
  el.textContent = `+${xp} XP`;

  el.style.left = rect.left + rect.width / 2 + "px";
  el.style.top = rect.top + "px";

  document.body.appendChild(el);

  setTimeout(() => {
    el.style.transform = "translateY(-60px)";
    el.style.opacity = "0";
  }, 10);

  setTimeout(() => el.remove(), 900);
}
