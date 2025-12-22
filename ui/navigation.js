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

// src/ui/navigation.js

import { qs, qsa } from "../utils/dom.js";

/**
 * Ініціалізація навігації по вкладках
 */
export function initNavigation() {
  const buttons = qsa("[data-page]");
  const pages = qsa(".page");

  if (!buttons.length || !pages.length) {
    console.warn("⚠️ Navigation: кнопки або сторінки не знайдені");
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return;

      // кнопки
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // сторінки
      pages.forEach(p => p.classList.remove("active"));

      const target = qs(`#page-${page}`);
      if (!target) {
        console.warn("⚠️ Page not found:", page);
        return;
      }

      target.classList.add("active");
    });
  });

  console.log("🧭 Navigation ready");
}