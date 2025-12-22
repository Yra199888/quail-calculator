/**
 * warnings.js
 * ---------------------------------------
 * UI-попередження (мінімальні залишки, проблеми)
 * НЕ містить бізнес-логіки
 */

import { AppState } from "../state/AppState.js";

/**
 * Оновлення блоку попереджень складу
 */
export function initWarnings () {
  const box = document.getElementById("warehouseWarning");
  const listEl = document.getElementById("warehouseWarningList");

  if (!box || !listEl) return;

  const mins = AppState.warehouse.minimums || {};
  const warnings = [];

  // кормові компоненти
  for (const c of AppState.feedComponents) {
    const stock = Number(AppState.warehouse.feed[c.id] || 0);
    const min = Number(mins[c.id] || 0);

    if (min > 0 && stock < min) {
      warnings.push(
        `• ${c.name}: ${stock.toFixed(2)} (мін. ${min})`
      );
    }
  }

  // порожні лотки
  const trayMin = Number(mins.empty_trays || 0);
  const trayStock = Number(AppState.warehouse.trays || 0);

  if (trayMin > 0 && trayStock < trayMin) {
    warnings.push(
      `• Порожні лотки: ${trayStock} (мін. ${trayMin})`
    );
  }

  if (warnings.length) {
    listEl.innerHTML = warnings.join("<br>");
    box.style.display = "block";
  } else {
    box.style.display = "none";
    listEl.innerHTML = "";
  }
}