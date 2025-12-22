/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 */

import {
  getFeedStock,
  addFeedStock,
  consumeFeedStock,
  getEmptyTrays,
  addEmptyTrays,
  getWarehouseWarnings
} from "../services/warehouse.service.js";

import { getFeedComponents } from "../services/feed.service.js";
import { saveState } from "../state/state.save.js";
import { qs, qsa } from "../utils/dom.js";

// =======================================
// ГОЛОВНИЙ RENDER
// =======================================
export function renderWarehouse() {
  renderFeedWarehouseTable();
  renderTraysBlock();
  renderWarehouseWarnings();
}

// =======================================
// КОРМОВІ КОМПОНЕНТИ
// =======================================
function renderFeedWarehouseTable() {
  const tbody = qs("#warehouseFeedTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const components = getFeedComponents();

  components.forEach(c => {
    const stock = getFeedStock(c.id);

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${c.name}</td>
        <td>${stock.toFixed(2)}</td>
        <td>
          <input type="number" step="0.1" data-add="${c.id}">
          <button data-add-btn="${c.id}">➕</button>
        </td>
        <td>
          <input type="number" step="0.1" data-use="${c.id}">
          <button data-use-btn="${c.id}">➖</button>
        </td>
      </tr>
    `
    );
  });

  bindFeedActions();
}

// =======================================
// PODIЇ (тимчасово тут)
// =======================================
function bindFeedActions() {
  qsa("[data-add-btn]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.addBtn;
      const input = qs(`[data-add="${id}"]`);
      const val = Number(input?.value || 0);
      if (val <= 0) return;

      addFeedStock(id, val);
      saveState();
      renderWarehouse();
    };
  });

  qsa("[data-use-btn]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.useBtn;
      const input = qs(`[data-use="${id}"]`);
      const val = Number(input?.value || 0);
      if (val <= 0) return;

      if (!consumeFeedStock(id, val)) {
        alert("❌ Недостатньо компонента");
        return;
      }

      saveState();
      renderWarehouse();
    };
  });
}

// =======================================
// ЛОТКИ
// =======================================
function renderTraysBlock() {
  const valueEl = qs("#emptyTraysValue");
  if (!valueEl) return;

  valueEl.textContent = getEmptyTrays();

  const btn = qs("#addEmptyTraysBtn");
  const input = qs("#addEmptyTraysInput");

  if (btn && input) {
    btn.onclick = () => {
      const val = Number(input.value || 0);
      if (val <= 0) return;

      addEmptyTrays(val);
      saveState();
      renderWarehouse();
    };
  }
}

// =======================================
// ПОПЕРЕДЖЕННЯ
// =======================================
function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  box.innerHTML = "";

  const warnings = getWarehouseWarnings();

  if (warnings.length === 0) {
    box.innerHTML = `<div class="ok">✅ Склад у нормі</div>`;
    return;
  }

  warnings.forEach(w => {
    box.insertAdjacentHTML(
      "beforeend",
      `
      <div class="warning">
        ⚠️ ${w.name}: ${w.stock} / мін ${w.min}
      </div>
    `
    );
  });
}