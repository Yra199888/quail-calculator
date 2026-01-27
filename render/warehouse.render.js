/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * БЕЗПЕЧНА ВЕРСІЯ (FIX):
 *  - не ламає стару таблицю
 *  - прибирає дублювання (картки vs таблиця)
 *  - ❌ ПОВНІСТЮ ПРИБИРАЄ МОДАЛКУ СКЛАДУ (нижню)
 *  - ✅ прибирає помилку "#warehouseModal"
 *  - ✅ кнопки ➕ / ➖ не ламають додаток (без відкриття модалки)
 *  - без бізнес-логіки рецептів (поки що)
 */

import {
  getFeedStock,
  getEmptyTrays,
  addEmptyTrays,
  getWarehouseWarnings
} from "../services/warehouse.service.js";

import { getFeedComponents } from "../services/feed.service.js";
import { saveState } from "../state/state.save.js";
import { qs } from "../utils/dom.js";
import { calcTrayStats } from "../utils/trays.calc.js";
import { AppState } from "../state/AppState.js";
import { renderLogs } from "./logs.render.js";

/* =======================================
   ВНУТРІШНІ ПРАПОРЦІ (ЩОБ НЕ ДУБЛЮВАТИ ОБРОБНИКИ)
======================================= */
let isWarehouseDelegationBound = false;

/* =======================================
   ГОЛОВНИЙ РЕНДЕР СКЛАДУ
======================================= */
export function renderWarehouse() {
  renderFeedWarehouse();
  renderEggTraysBlock();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs();

  bindWarehouseDelegationOnce();
}

/* =======================================
   ВИБІР РЕЖИМУ ВІДОБРАЖЕННЯ
   - якщо є картки: показуємо картки, ховаємо таблицю
   - якщо карток немає: показуємо таблицю
======================================= */
function renderFeedWarehouse() {
  const cardsBox = qs("#warehouseFeedCards");
  const tableBody = qs("#warehouseFeedTableBody");
  const tableEl = tableBody ? tableBody.closest("table") : null;

  const hasCards = !!cardsBox;
  const hasTable = !!tableBody;

  if (hasCards) {
    cardsBox.style.display = "";

    // сховати таблицю, щоб не було дубля
    if (tableEl) tableEl.style.display = "none";
    if (tableBody) tableBody.innerHTML = "";

    renderFeedCards(cardsBox);
    return;
  }

  // якщо карток немає — таблиця
  if (hasTable) {
    if (tableEl) tableEl.style.display = "";
    renderFeedTable(tableBody);
  }
}

/* =======================================
   СТАРА ТАБЛИЦЯ (РЕЗЕРВНИЙ ВАРІАНТ)
======================================= */
function renderFeedTable(tbody) {
  tbody.innerHTML = "";

  getFeedComponents().forEach((c) => {
    const stock = getFeedStock(c.id);

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${c.name}</td>
        <td>${stock.toFixed(2)}</td>
        <td><button class="primary" data-add-btn="${c.id}" type="button">➕</button></td>
        <td><button class="danger" data-use-btn="${c.id}" type="button">➖</button></td>
      </tr>
      `
    );
  });
}

/* =======================================
   КАРТКИ КОМПОНЕНТІВ СКЛАДУ
======================================= */
function renderFeedCards(box) {
  box.innerHTML = "";

  const components = getFeedComponents();
  let totalStock = 0;

  components.forEach((c) => {
    const stock = getFeedStock(c.id);
    totalStock += stock;

    const percent = Math.min(100, (stock / 10) * 100);

    box.insertAdjacentHTML(
      "beforeend",
      `
      <div class="warehouse-card">
        <div class="row">
          <div class="name">${c.name}</div>
          <div class="stock">${stock.toFixed(2)} кг</div>
        </div>

        <div class="warehouse-bar" style="margin-top:10px; border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
          <div class="warehouse-bar__fill" style="height:8px; width:${percent}%; background: rgba(76,175,80,0.65);"></div>
        </div>

        <div class="actions" style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn small primary" data-add="${c.id}" title="Додати" type="button">➕</button>
          <button class="btn small danger" data-use="${c.id}" title="Списати" type="button">➖</button>
        </div>
      </div>
      `
    );
  });

  box.insertAdjacentHTML(
    "beforeend",
    `
    <div class="warehouse-footer" style="margin-top:12px; border:1px solid var(--border-color); border-radius:14px; padding:12px; background: var(--bg-panel); display:flex; gap:12px; justify-content:space-between; align-items:center; flex-wrap:wrap;">
      <div class="warehouse-footer__info">
        <div class="warehouse-footer__title" style="font-weight:800;">Загальний залишок корму</div>
        <div class="warehouse-footer__value" style="margin-top:4px;">
          <b style="font-size:18px;">${totalStock.toFixed(2)}</b> кг
        </div>
        <div class="muted" style="font-size:12px; margin-top:4px;">
          Списання за рецептом виконується через кнопку «Замішати корм»
        </div>
      </div>

      <div class="warehouse-footer__actions" style="display:flex; gap:8px;">
        <button class="btn primary" id="mixFeedBtn" type="button">🌾 Замішати корм</button>
        <button class="btn danger" id="consumeFeedBtn" type="button" disabled title="Тимчасово недоступно">➖ Списати корм</button>
      </div>
    </div>
    `
  );
}

/* =======================================
   ДЕЛЕГАЦІЯ КЛІКІВ ДЛЯ СКЛАДУ (1 РАЗ)
   ✅ FIX: не відкриваємо модалку, щоб не було нижнього вікна
======================================= */
function bindWarehouseDelegationOnce() {
  if (isWarehouseDelegationBound) return;
  isWarehouseDelegationBound = true;

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add],[data-add-btn]");
    const useBtn = e.target.closest("[data-use],[data-use-btn]");

    if (!addBtn && !useBtn) return;

    // Щоб не було випадкових submit/фокусів
    e.preventDefault();

    // Модалку прибрали — даємо зрозуміле повідомлення
    alert("ℹ️ Додавання/списання через ці кнопки зараз вимкнено (модалку прибрано). Використай «🌾 Замішати корм» або скажи — зроблю inline-ввід без модалки.");
  });
}

/* =======================================
   ЛОТКИ ТА ПОПЕРЕДЖЕННЯ
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

function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  const warnings = getWarehouseWarnings();
  box.innerHTML = warnings.length
    ? warnings.map((w) => `⚠️ ${w.name}: ${w.stock} / мін ${w.min}`).join("<br>")
    : "✅ Склад у нормі";
}