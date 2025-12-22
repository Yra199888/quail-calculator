/**
 * navigation.js
 * ---------------------------------------
 * Відповідає за навігацію між сторінками додатку.
 * 
 * Обовʼязки:
 *  - перемикання активної сторінки
 *  - підсвітка активної кнопки
 *  - збереження поточної сторінки в AppState
 *
 * НЕ містить бізнес-логіки
 */

import { AppState } from "../state/AppState.js";
import { saveState } from "../state/state.save.js";

/**
 * Ініціалізація навігації
 * Викликається один раз з app.js
 */
export function initNavigation() {
  const buttons = document.querySelectorAll("[data-page]");

  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return;

      setActivePage(page);
    });
  });

  // відновлення сторінки зі state
  if (AppState.ui?.page) {
    setActivePage(AppState.ui.page, false);
  }
}

/**
 * Увімкнути сторінку
 * @param {string} page
 * @param {boolean} persist - чи зберігати у state
 */
export function setActivePage(page, persist = true) {
  // сторінки
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active-page")
  );

  const target = document.getElementById(`page-${page}`);
  if (!target) {
    console.warn(`Сторінка page-${page} не знайдена`);
    return;
  }

  target.classList.add("active-page");

  // кнопки
  document.querySelectorAll("[data-page]").forEach(btn =>
    btn.classList.remove("active")
  );

  const activeBtn = document.querySelector(`[data-page="${page}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // state
  AppState.ui.page = page;

  if (persist) {
    saveState();
  }
}