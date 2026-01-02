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

// 🧮 ЛОТКИ З ЯЄЦЬ
import { calcTrayStats } from "../utils/trays.calc.js";
import { AppState } from "../state/AppState.js";
import { renderLogs } from "./logs.render.js";

// =======================================
// ГОЛОВНИЙ RENDER
// =======================================
export function renderWarehouse() {
  renderFeedWarehouseTable();
  renderEggTraysBlock();        // 🥚 готові лотки (+ бронь + підсвітка)
  renderProductionForecast();  // 🔮 ПРОГНОЗ (НОВЕ, БЕЗПЕЧНО)
  renderTraysBlock();           // 🧺 порожні лотки
  renderWarehouseWarnings();
  renderLogs(); // 🧾 ЖУРНАЛ
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
// PODIЇ КОРМУ
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
// 🥚 ГОТОВІ ЛОТКИ З ЯЄЦЬ (+ бронь + підсвітка)
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

  const totalGoodEggs = Number(stats.totalGoodEggs || 0);
  const totalTrays = Number(stats.totalTrays || 0);
  const shippedTrays = Number(stats.shippedTrays || 0);
  const reservedTrays = Number(stats.reservedTrays || 0);

  const availableBeforeReserve = Math.max(totalTrays - shippedTrays, 0);
  const computedAvailable = Math.max(availableBeforeReserve - reservedTrays, 0);

  const deficitTrays = Number(
    stats.deficitTrays != null
      ? stats.deficitTrays
      : Math.max(reservedTrays - availableBeforeReserve, 0)
  );

  const leftoverEggs = Number(stats.leftoverEggs || 0);

  const statusClass = deficitTrays > 0 ? "egg-trays danger" : "egg-trays ok";
  const statusText =
    deficitTrays > 0
      ? `⚠️ Дефіцит: бракує <b>${deficitTrays}</b> лотків для броні`
      : `✅ Все ок: бронь покривається складом`;

  content.innerHTML = `
    <div class="${statusClass}">
      <div class="egg-trays-status">${statusText}</div>

      <div class="egg-trays-grid">
        <div>🥚 Всього яєць: <b>${totalGoodEggs}</b></div>
        <div>📦 Повних лотків: <b>${totalTrays}</b></div>
        <div>🧺 Виконано: <b>${shippedTrays}</b></div>
        <div>🟡 Заброньовано: <b>${reservedTrays}</b></div>
        <div>🟢 Доступно: <b>${computedAvailable}</b></div>
        <div>➕ Залишок яєць: <b>${leftoverEggs}</b></div>
      </div>
    </div>
  `;
}

// =======================================
// 🔮 ПРОГНОЗ ПОКРИТТЯ ЗАМОВЛЕНЬ (НОВЕ)
// ❗ ТІЛЬКИ UI, БЕЗ МУТАЦІЙ
// =======================================
function renderProductionForecast() {
  let box = qs("#productionForecastBlock");

  if (!box) {
    const panel = qs("#page-warehouse .panel");
    if (!panel) return;

    panel.insertAdjacentHTML(
      "beforeend",
      `
      <div id="productionForecastBlock" style="margin-top:12px">
        <div class="panel-title">🔮 Прогноз покриття замовлень</div>
        <div id="productionForecastContent"></div>
      </div>
      `
    );

    box = qs("#productionForecastBlock");
  }

  const content = qs("#productionForecastContent");
  if (!content) return;

  const stats = calcTrayStats(AppState || {});
  const records = AppState.eggs?.records || {};

  const days = Object.keys(records).sort().slice(-7);

  let eggsSum = 0;
  days.forEach(d => {
    eggsSum += Number(records[d]?.good || 0);
  });

  const avgPerDay = days.length ? Math.round(eggsSum / days.length) : 0;

  const deficitTrays = Number(stats.deficitTrays || 0);
  const eggsPerTray = Number(stats.trayCapacity || 20);
  const deficitEggs = deficitTrays * eggsPerTray;

  const daysToCover =
    avgPerDay > 0 ? Math.ceil(deficitEggs / avgPerDay) : null;

  content.innerHTML = `
    <div class="egg-trays-grid">
      <div>📈 Середня несучість: <b>${avgPerDay}</b> яєць/день</div>
      <div>⚠️ Дефіцит броні: <b>${deficitTrays}</b> лотків</div>
      <div>
        ⏳ Покриття дефіциту:
        <b>
          ${
            deficitTrays === 0
              ? "не потрібне"
              : avgPerDay === 0
                ? "неможливо оцінити"
                : `~ ${daysToCover} дн.`
          }
        </b>
      </div>
    </div>
  `;
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