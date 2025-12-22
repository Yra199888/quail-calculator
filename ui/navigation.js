/**
 * ui/navigation.js
 * ---------------------------------------
 * Навігація між вкладками (SPA)
 * Працює через data-page
 */

export function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  if (!buttons.length || !pages.length) {
    console.warn("⚠️ Navigation: buttons або pages не знайдені");
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return;

      const target = document.querySelector(`.page[data-page="${page}"]`);
      if (!target) {
        console.warn(`⚠️ Page not found: ${page}`);
        return;
      }

      // прибрати active з усіх
      pages.forEach(p => p.classList.remove("active"));
      buttons.forEach(b => b.classList.remove("active"));

      // активувати потрібну
      target.classList.add("active");
      btn.classList.add("active");
    });
  });

  console.log("🧭 Navigation ready");
}