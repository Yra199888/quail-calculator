/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 * ПІДТРИМУЄ:
 *  - стару таблицю (fallback)
 *  - нові warehouse cards (якщо контейнер існує)
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
import { calcTrayStats } from "../utils/trays.calc.js";
import { AppState } from "../state/AppState.js";
import { renderLogs } from "./logs.render.js";

/* =======================================
   MAIN RENDER
======================================= */
export function renderWarehouse() {
  renderFeedWarehouse();
  renderEggTraysBlock();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs();
}

/* =======================================
   🌾 FEED (AUTO MODE)
======================================= */
function renderFeedWarehouse() {
  const cardsBox = qs("#warehouseFeedCards");
  const tableBody = qs("#warehouseFeedTableBody");

  if (cardsBox) {
    renderFeedCards(cardsBox);
  } else if (tableBody) {
    renderFeedTable(tableBody);
  }
}

/* =======================================
   📋 OLD TABLE (100% SAFE)
======================================= */
function renderFeedTable(tbody) {
  tbody.innerHTML = "";

  getFeedComponents().forEach(c => {
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

  bindTableActions();
}

function bindTableActions() {
  qsa("[data-add-btn]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.addBtn;
      const val = Number(qs(`[data-add="${id}"]`)?.value || 0);
      if (val <= 0) return;

      addFeedStock(id, val);
      saveState();
      renderWarehouse();
    };
  });

  qsa("[data-use-btn]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.useBtn;
      const val = Number(qs(`[data-use="${id}"]`)?.value || 0);
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

/* =======================================
   🧱 NEW CARDS (OPTIONAL)
======================================= */
function renderFeedCards(box) {
  box.innerHTML = "";

  getFeedComponents().forEach(c => {
    const stock = getFeedStock(c.id);

    box.insertAdjacentHTML(
      "beforeend",
      `
      <div class="warehouse-card">
        <div class="row">
          <div class="name">${c.name}</div>
          <div class="stock">${stock.toFixed(2)} кг</div>
        </div>
        <div class="actions">
          <button class="btn primary" data-add="${c.id}">➕</button>
          <button class="btn" data-use="${c.id}">➖</button>
        </div>
      </div>
      `
    );
  });

  bindCardActions();
}

function bindCardActions() {
  qsa("[data-add]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.add;
      const val = Number(prompt("Скільки додати (кг)?", "1"));
      if (!val || val <= 0) return;

      addFeedStock(id, val);
      saveState();
      renderWarehouse();
    };
  });

  qsa("[data-use]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.use;
      const val = Number(prompt("Скільки списати (кг)?", "1"));
      if (!val || val <= 0) return;

      if (!consumeFeedStock(id, val)) {
        alert("❌ Недостатньо компонента");
        return;
      }

      saveState();
      renderWarehouse();
    };
  });
}

/* =======================================
   🥚 EGG TRAYS
======================================= */
function renderEggTraysBlock() {
  const box = qs("#eggTraysContent");
  if (!box) return;

  const stats = calcTrayStats(AppState || {});
  const deficit = Math.max(
    (stats.reservedTrays || 0) - (stats.availableTrays || 0),
    0
  );

  box.innerHTML = `
    <div class="egg-trays ${deficit > 0 ? "danger" : "ok"}">
      <div class="egg-trays-grid">
        <div>📦 Повних: <b>${stats.totalTrays}</b></div>
        <div>🟡 Резерв: <b>${stats.reservedTrays}</b></div>
        <div>🟢 Доступно: <b>${stats.availableTrays}</b></div>
        <div>⚠️ Дефіцит: <b>${deficit}</b></div>
      </div>
    </div>
  `;
}

/* =======================================
   🧺 EMPTY TRAYS
======================================= */
function renderTraysBlock() {
  const valueEl = qs("#emptyTraysValue");
  const btn = qs("#addEmptyTraysBtn");
  const input = qs("#addEmptyTraysInput");

  if (!valueEl || !btn || !input) return;

  valueEl.textContent = getEmptyTrays();

  btn.onclick = () => {
    const val = Number(input.value || 0);
    if (val <= 0) return;

    addEmptyTrays(val);
    saveState();
    renderWarehouse();
  };
}

/* =======================================
   ⚠️ WARNINGS
======================================= */
function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  const warnings = getWarehouseWarnings();
  box.innerHTML = warnings.length
    ? warnings.map(w => `⚠️ ${w.name}: ${w.stock} / мін ${w.min}`).join("<br>")
    : "✅ Склад у нормі";
}