/**
 * 🧭 ui/navigation.js
 * ---------------------------------------
 * Навігація між вкладками додатку.
 *
 * ❗ ВІДПОВІДАЄ ТІЛЬКИ ЗА:
 * - перемикання сторінок
 * - збереження активної сторінки в AppState
 *
 * ❌ НЕ:
 * - не рендерить дані
 * - не змінює бізнес-логіку
 */

import { AppState } from "../state/AppState.js";
import { saveState } from "../state/state.save.js";

export function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  if (!navButtons.length || !pages.length) {
    console.warn("⚠️ Navigation: кнопки або сторінки не знайдені");
    return;
  }

  // =========================
  // ПЕРЕМИКАННЯ ПО КЛІКУ
  // =========================
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return;

      activatePage(page);
    });
  });

  // =========================
  // ВІДНОВЛЕННЯ СТАНУ
  // =========================
  const initialPage = AppState.ui.page || navButtons[0].dataset.page;
  activatePage(initialPage);

  console.log("🧭 Navigation ready");
}

/**
 * Активувати сторінку
 */
function activatePage(pageName) {
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll(".nav-btn");

  let pageFound = false;

  pages.forEach(p => {
    if (p.id === `page-${pageName}`) {
      p.classList.add("active-page");
      pageFound = true;
    } else {
      p.classList.remove("active-page");
    }
  });

  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });

  if (!pageFound) {
    console.warn(`⚠️ Page not found: ${pageName}`);
    return;
  }

  AppState.ui.page = pageName;
  saveState();
}