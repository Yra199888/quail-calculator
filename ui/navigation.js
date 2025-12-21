// ui/navigation.js

import { $ } from "../utils/dom.js";

export function bindNavigation(AppState, saveAppState) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return;

      document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active-page"));

      const target = $("page-" + page);
      if (!target) return;

      target.classList.add("active-page");

      document.querySelectorAll(".nav-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      AppState.ui.page = page;
      saveAppState();
    });
  });
}

export function restoreActivePage(AppState) {
  const page = AppState.ui.page || "calculator";

  document.querySelectorAll(".page")
    .forEach(p => p.classList.remove("active-page"));

  const target = document.getElementById("page-" + page);
  if (target) target.classList.add("active-page");

  document.querySelectorAll(".nav-btn")
    .forEach(b => b.classList.remove("active"));

  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
}