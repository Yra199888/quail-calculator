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

// ui/navigation.js
import { qsa } from "../utils/dom.js";

export function initNavigation() {
  const buttons = qsa(".nav-btn");
  const pages = qsa(".page");

  if (!buttons.length || !pages.length) {
    console.warn("🧭 Navigation: buttons or pages not found");
    return;
  }

  function showPage(page) {
    let found = false;

    pages.forEach(p => {
      if (p.dataset.page === page) {
        p.style.display = "block";
        found = true;
      } else {
        p.style.display = "none";
      }
    });

    buttons.forEach(b => {
      b.classList.toggle("active", b.dataset.page === page);
    });

    if (!found) {
      console.warn(`⚠️ Page not found: ${page}`);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      showPage(page);
    });
  });

  // 👉 стартова сторінка
  showPage(buttons[0].dataset.page);

  console.log("🧭 Navigation ready");
}