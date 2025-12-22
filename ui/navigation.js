// src/ui/navigation.js

/**
 * 🧭 Навігація між вкладками
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за:
 * - перемикання сторінок
 * - активну кнопку
 */

import { AppState } from "../state/AppState.js";

export function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  if (!buttons.length || !pages.length) {
    console.warn("⚠️ Navigation: кнопки або сторінки не знайдені");
    return;
  }

  // клік по кнопці
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      showPage(page);
    });
  });

  // показати сторінку зі state або feed за замовчуванням
  showPage(AppState.ui.page || "feed");

  console.log("🧭 Navigation ready");
}

function showPage(page) {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".nav-btn");

  const targetId = `page-${page}`;
  const targetPage = document.getElementById(targetId);

  if (!targetPage) {
    console.warn("⚠️ Page not found:", targetId);
    return;
  }

  // сховати всі сторінки
  pages.forEach(p => p.classList.remove("active"));
  buttons.forEach(b => b.classList.remove("active"));

  // показати потрібну
  targetPage.classList.add("active");
  document
    .querySelector(`.nav-btn[data-page="${page}"]`)
    ?.classList.add("active");

  // зберегти в state
  AppState.ui.page = page;
}