/**
 * render.warehouse.js
 * ---------------------------------------
 * Render-шар складу.
 * Відповідає лише за відображення даних складу.
 */

import { AppState } from "../state/AppState.js";

/**
 * Головний render складу
 */
export function renderWarehouse() {
  renderWarehouseTable();
  renderWarehouseTrays();
  renderWarehouseWarnings();
}

/**
 * Таблиця кормових компонентів
 */
function renderWarehouseTable() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

  const components = getAllFeedComponents();
  const minimums = AppState.warehouse.minimums || {};

  tbody.innerHTML = components
    .map(c => {
      const stock = Number(AppState.warehouse.feed[c.id] || 0);
      const min = Number(minimums[c.id] || 0);
      const isLow = min > 0 && stock < min;

      return `
        <tr style="${isLow ? "background:#3a1c1c;color:#ffb3b3;" : ""}">
          <td>${isLow ? "⚠️ " : ""}${c.name}</td>

          <td>
            <input
              class="addStock"
              data-id="${c.id}"
              type="number"
              value="0"
            >
          </td>

          <td>${c.defaultQty}</td>

          <td><b>${stock.toFixed(2)}</b></td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Лотки (готові / зарезервовані)
 */
function renderWarehouseTrays() {
  const readyEl = document.getElementById("fullTrays");
  const reservedEl = document.getElementById("reservedTrays");

  if (readyEl) {
    readyEl.textContent = AppState.warehouse.ready || 0;
  }

  if (reservedEl) {
    reservedEl.textContent = AppState.warehouse.reserved || 0;
  }
}

/**
 * Попередження мінімальних залишків
 */
function renderWarehouseWarnings() {
  const box = document.getElementById("warehouseWarning");
  const listEl = document.getElementById("warehouseWarningList");

  if (!box || !listEl) return;

  const minimums = AppState.warehouse.minimums || {};
  const warnings = [];

  // кормові компоненти
  getAllFeedComponents().forEach(c => {
    const stock = Number(AppState.warehouse.feed[c.id] || 0);
    const min = Number(minimums[c.id] || 0);

    if (min > 0 && stock < min) {
      warnings.push(
        `• ${c.name}: ${stock.toFixed(2)} кг (мін. ${min})`
      );
    }
  });

  // порожні лотки
  const trayMin = Number(minimums.empty_trays || 0);
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
    listEl.innerHTML = "";
    box.style.display = "none";
  }
}

/**
 * Всі кормові компоненти
 */
function getAllFeedComponents() {
  return AppState.feedComponents || [];
}