/**
 * navigation.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за навігацію між сторінками (вкладками):
 *  - перемикання active-page
 *  - підсвітка активної кнопки
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ AppState
 * ❌ БЕЗ localStorage
 */

import { qs, qsa } from "../utils/dom.js";

// =======================================
// ІНІЦІАЛІЗАЦІЯ НАВІГАЦІЇ
// =======================================
export function initNavigation() {
  const buttons = qsa("[data-page]");
  const pages = qsa(".page");

  if (!buttons.length || !pages.length) return;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPage = btn.dataset.page;
      if (!targetPage) return;

      // 1️⃣ Ховаємо всі сторінки
      pages.forEach(p => p.classList.remove("active-page"));

      // 2️⃣ Показуємо потрібну
      const pageEl = qs(`#page-${targetPage}`);
      if (pageEl) pageEl.classList.add("active-page");

      // 3️⃣ Знімаємо active з усіх кнопок
      buttons.forEach(b => b.classList.remove("active"));

      // 4️⃣ Активуємо поточну кнопку
      btn.classList.add("active");
    });
  });
}