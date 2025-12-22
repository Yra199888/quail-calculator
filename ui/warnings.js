/**
 * warnings.js
 * ---------------------------------------
 * Відповідає за відображення попереджень у UI.
 *
 * Обовʼязки:
 *  - показ / приховування блоку попереджень
 *  - рендер списку проблем
 *
 * НЕ містить бізнес-логіки
 */

import { AppState } from "../state/AppState.js";

/**
 * Оновити всі попередження
 * Викликається після render або зміни state
 */
export function renderWarnings() {
  const box = document.getElementById("warehouseWarning");
  const list = document.getElementById("warehouseWarningList");

  if (!box || !list) return;

  const warnings = collectWarnings();

  if (!warnings.length) {
    box.style.display = "none";
    list.innerHTML = "";
    return;
  }

  list.innerHTML = warnings.map(w => `• ${w}`).join("<br>");
  box.style.display = "block";
}

/**
 * Зібрати всі попередження з AppState
 * @returns {string[]}
 */
function collectWarnings() {
  const result = [];

  // ===== КОРМОВІ КОМПОНЕНТИ =====
  const components = AppState.feedComponents || [];
  const mins = AppState.warehouse?.minimums || {};
  const stock = AppState.warehouse?.feed || {};

  components.forEach(c => {
    const min = Number(mins[c.id] || 0);
    const qty = Number(stock[c.id] || 0);

    if (min > 0 && qty < min) {
      result.push(
        `${c.name}: ${qty.toFixed(2)} кг (мін. ${min})`
      );
    }
  });

  // ===== ПОРОЖНІ ЛОТКИ =====
  const traysMin = Number(mins.empty_trays || 0);
  const traysQty = Number(AppState.warehouse?.trays || 0);

  if (traysMin > 0 && traysQty < traysMin) {
    result.push(
      `Порожні лотки: ${traysQty} (мін. ${traysMin})`
    );
  }

  return result;
}