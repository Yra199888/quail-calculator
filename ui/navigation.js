/**
 * 🧭 navigation.js
 * ---------------------------------------
 * ЄДИНЕ джерело правди для вкладок
 */

import { AppState } from "../state/AppState.js";

export function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");

  if (!buttons.length) {
    console.warn("⚠️ Navigation: кнопки не знайдені");
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      showPage(page);
    });
  });

  // стартова сторінка
  showPage(AppState.ui.page || "feed");

  console.log("🧭 Navigation ready");
}

function showPage(page) {
  const pageId = `page-${page}`;
  const target = document.getElementById(pageId);

  if (!target) {
    console.warn(`⚠️ Page not found: ${pageId}`);
    return;
  }

  // приховати всі
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  // показати потрібну
  target.classList.add("active");

  // кнопки
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  AppState.ui.page = page;
}