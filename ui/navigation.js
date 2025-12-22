// src/ui/navigation.js

import { AppState } from "../state/AppState.js";

export function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  console.log("🧭 pages found:", [...pages].map(p => p.id));

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      activatePage(page);
    });
  });

  activatePage(AppState.ui.page || "feed");
  console.log("🧭 Navigation ready");
}

function activatePage(page) {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".nav-btn");

  const pageId = `page-${page}`;
  const target = document.getElementById(pageId);

  if (!target) {
    console.warn("⚠️ Page not found:", pageId);
    return;
  }

  pages.forEach(p => p.classList.remove("active"));
  buttons.forEach(b => b.classList.remove("active"));

  target.classList.add("active");

  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add("active");

  AppState.ui.page = page;
}