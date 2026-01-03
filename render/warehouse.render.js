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

import { calcTrayStats } from "../utils/trays.calc.js";
import { AppState } from "../state/AppState.js";
import { renderLogs } from "./logs.render.js"; // ✅ ВАЖЛИВО

// =======================================
// ГОЛОВНИЙ RENDER
// =======================================
export function renderWarehouse() {
  renderFeedWarehouseTable();
  renderEggTraysBlock();
  renderProductionForecast();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs(); // ✅ журнал тут
}

// =======================================
// 🌾 КОРМОВІ КОМПОНЕНТИ
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
// 🥚 ЛОТКИ
// =======================================
function renderEggTraysBlock() {
  let box = qs("#eggTraysBlock");

  if (!box) {
    const panel = qs("#page-warehouse .panel");
    if (!panel) return;

    panel.insertAdjacentHTML(
      "beforeend",
      `
      <div id="eggTraysBlock" style="margin-top:12px">
        <div class="panel-title">🥚 Готові лотки з яєць</div>
        <div id="eggTraysContent"></div>
      </div>
      `
    );

    box = qs("#eggTraysBlock");
  }

  const content = qs("#eggTraysContent");
  if (!content) return;

  const stats = calcTrayStats(AppState || {});

  const availableBeforeReserve = Math.max(
    (stats.totalTrays || 0) - (stats.shippedTrays || 0),
    0
  );

  const deficit =
    stats.deficitTrays ??
    Math.max((stats.reservedTrays || 0) - availableBeforeReserve, 0);

  content.innerHTML = `
    <div class="${deficit > 0 ? "egg-trays danger" : "egg-trays ok"}">
      <div class="egg-trays-grid">
        <div>📦 Повних лотків: <b>${stats.totalTrays}</b></div>
        <div>🟡 Заброньовано: <b>${stats.reservedTrays}</b></div>
        <div>🟢 Доступно: <b>${stats.availableTrays}</b></div>
        <div>⚠️ Дефіцит: <b>${deficit}</b></div>
      </div>
    </div>
  `;
}

// =======================================
function renderProductionForecast() {
  const box = qs("#productionForecastBlock");
  if (!box) return;
}

// =======================================
// 🧺 ПОРОЖНІ ЛОТКИ
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
// ⚠️ ПОПЕРЕДЖЕННЯ
// =======================================
function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  const warnings = getWarehouseWarnings();
  box.innerHTML = warnings.length
    ? warnings.map(w => `⚠️ ${w.name}: ${w.stock} / мін ${w.min}`).join("<br>")
    : "✅ Склад у нормі";
}