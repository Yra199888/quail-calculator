/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу:
 *  - залишки кормових компонентів
 *  - порожні лотки
 *  - попередження по мінімумам
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ localStorage
 * ❌ БЕЗ AppState напряму
 */

import { AppState } from "../state/AppState.js";
import {
  getFeedStock,
  addFeedStock,
  consumeFeedStock,
  getEmptyTrays,
  addEmptyTrays,
  getWarehouseWarnings
} from "../services/warehouse.service.js";

import { saveState } from "../state/state.save.js";
import { qs, qsa } from "../utils/dom.js";

// =======================================
// ГОЛОВНИЙ РЕНДЕР
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

  const components = AppState.feedComponents || [];

  components.forEach(component => {
    const tr = document.createElement("tr");

    const stock = getFeedStock(component.id);

    tr.innerHTML = `
      <td>${component.name}</td>
      <td>${stock.toFixed(2)}</td>
      <td>
        <input 
          type="number" 
          min="0" 
          step="0.1"
          data-add-id="${component.id}"
          placeholder="+ кг"
        />
        <button data-add-btn="${component.id}">➕</button>
      </td>
      <td>
        <input 
          type="number" 
          min="0" 
          step="0.1"
          data-use-id="${component.id}"
          placeholder="- кг"
        />
        <button data-use-btn="${component.id}">➖</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  bindFeedWarehouseActions();
}

// =======================================
// ОБРОБКА ПОДІЙ (КОРМ)
// =======================================
function bindFeedWarehouseActions() {
  // ➕ ДОДАТИ
  qsa("[data-add-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.addBtn;
      const input = qs(`[data-add-id="${id}"]`);
      const value = Number(input?.value || 0);

      if (value <= 0) return;

      addFeedStock(id, value);
      saveState();
      renderWarehouse();
    });
  });

  // ➖ СПИСАТИ
  qsa("[data-use-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.useBtn;
      const input = qs(`[data-use-id="${id}"]`);
      const value = Number(input?.value || 0);

      if (value <= 0) return;

      const ok = consumeFeedStock(id, value);
      if (!ok) {
        alert("❌ Недостатньо компонента на складі");
        return;
      }

      saveState();
      renderWarehouse();
    });
  });
}

// =======================================
// ПУСТІ ЛОТКИ
// =======================================
function renderTraysBlock() {
  const traysValue = qs("#emptyTraysValue");
  if (!traysValue) return;

  traysValue.textContent = getEmptyTrays();

  const addBtn = qs("#addEmptyTraysBtn");
  const input = qs("#addEmptyTraysInput");

  if (addBtn && input) {
    addBtn.onclick = () => {
      const value = Number(input.value || 0);
      if (value <= 0) return;

      addEmptyTrays(value);
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

  const warnings = getWarehouseWarnings(id => {
    const c = (AppState.feedComponents || []).find(x => x.id === id);
    return c ? c.name : id;
  });

  if (warnings.length === 0) {
    box.innerHTML = `<div class="ok">✅ Склад у нормі</div>`;
    return;
  }

  warnings.forEach(w => {
    const div = document.createElement("div");
    div.className = "warning";

    div.textContent =
      w.type === "trays"
        ? `⚠️ Мало лотків: ${w.stock} / мін ${w.min}`
        : `⚠️ ${w.name}: ${w.stock} кг / мін ${w.min} кг`;

    box.appendChild(div);
  });
}