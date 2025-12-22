/**
 * 🧭 navigation.js
 * ---------------------------------------
 * Навігація між вкладками
 * Працює з data-page + id="page-*"
 */

import { AppState } from "../state/AppState.js";

export function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  if (!buttons.length || !pages.length) {
    console.warn("⚠️ Navigation: кнопки або сторінки не знайдені");
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      activatePage(page);
    });
  });

  // відновлення сторінки зі state
  activatePage(AppState.ui.page || "feed");

  console.log("🧭 Navigation ready");
}

function activatePage(page) {
  const pageId = `page-${page}`;
  const target = document.getElementById(pageId);

  if (!target) {
    console.warn(`⚠️ Page not found: ${page}`);
    return;
  }

  // сховати всі
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );

  // показати потрібну
  target.classList.add("active");

  // активна кнопка
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );

  // зберегти в state
  AppState.ui.page = page;
}