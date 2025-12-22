/**
 * toggles.js
 * ---------------------------------------
 * UI-перемикачі режимів (on / off).
 *
 * Обовʼязки:
 *  - керування UI-флагами в AppState.ui
 *  - оновлення вигляду кнопок
 *  - збереження стану
 *
 * НЕ містить бізнес-логіки
 */

import { AppState } from "../state/AppState.js";
import { saveState } from "../state/state.save.js";

/**
 * Ініціалізація всіх toggle-кнопок
 * Викликається з app.js
 */
export function initToggles() {
  const toggles = document.querySelectorAll("[data-toggle]");

  toggles.forEach(btn => {
    const key = btn.dataset.toggle;
    if (!key) return;

    btn.addEventListener("click", () => {
      toggleFlag(key);
      updateToggleButton(btn, key);
    });

    // первинний стан
    updateToggleButton(btn, key);
  });
}

/**
 * Перемикання boolean-флагу в AppState.ui
 * @param {string} key
 */
function toggleFlag(key) {
  AppState.ui[key] = !AppState.ui[key];
  saveState();
}

/**
 * Оновлення вигляду кнопки
 * @param {HTMLElement} btn
 * @param {string} key
 */
function updateToggleButton(btn, key) {
  const enabled = !!AppState.ui[key];

  btn.classList.toggle("active", enabled);
  btn.textContent = enabled
    ? `🔓 ${btn.dataset.label || "Увімкнено"}`
    : `🔒 ${btn.dataset.label || "Вимкнено"}`;
}