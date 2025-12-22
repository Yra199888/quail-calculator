/**
 * toggles.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за UI-перемикачі:
 *  - редагування яєць
 *  - редагування складу
 *
 * ❌ Без бізнес-логіки
 * ❌ Без localStorage
 * ❌ Без знання, ЩО саме редагується
 */

import { qs } from "../utils/dom.js";

// =======================================
// ПУБЛІЧНИЙ API
// =======================================
export function initToggles({ onEggsToggle, onWarehouseToggle }) {
  const eggsBtn = qs("#toggle-eggs-edit");
  const warehouseBtn = qs("#toggle-warehouse-edit");

  if (eggsBtn && typeof onEggsToggle === "function") {
    eggsBtn.addEventListener("click", () => {
      const enabled = toggleButtonState(eggsBtn);
      onEggsToggle(enabled);
    });
  }

  if (warehouseBtn && typeof onWarehouseToggle === "function") {
    warehouseBtn.addEventListener("click", () => {
      const enabled = toggleButtonState(warehouseBtn);
      onWarehouseToggle(enabled);
    });
  }
}

// =======================================
// ВНУТРІШНЯ ЛОГІКА
// =======================================
function toggleButtonState(btn) {
  const enabled = btn.dataset.enabled !== "true";

  btn.dataset.enabled = String(enabled);
  paintButton(btn, enabled);

  return enabled;
}

function paintButton(btn, enabled) {
  btn.textContent = enabled ? "🔓 УВІМКНЕНО" : "🔒 ВИМКНЕНО";
  btn.classList.toggle("enabled", enabled);
}