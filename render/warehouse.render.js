/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * БЕЗПЕЧНА ВЕРСІЯ:
 *  - не ламає стару таблицю
 *  - використовує існуючу модалку #warehouseModal (з index.html)
 *  - кнопки ➕ / ➖ працюють стабільно (iOS-safe делегація подій)
 *  - кнопки мають кольорову семантику
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
import { qs } from "../utils/dom.js";
import { calcTrayStats } from "../utils/trays.calc.js";
import { AppState } from "../state/AppState.js";
import { renderLogs } from "./logs.render.js";

/* =======================================
   СТАН МОДАЛЬНОГО ВІКНА
======================================= */
let modalComponentId = null;
let modalAction = "add";
let eventsBound = false;

/* =======================================
   ГОЛОВНИЙ РЕНДЕР
======================================= */
export function renderWarehouse() {
  bindWarehouseEventsOnce();

  renderFeedWarehouse();
  renderEggTraysBlock();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs();
}

/* =======================================
   ПОДІЇ — 1 РАЗ (iOS-safe)
======================================= */
function bindWarehouseEventsOnce() {
  if (eventsBound) return;
  eventsBound = true;

  const root = qs("#page-warehouse") || document;

  // 1) ДЕЛЕГАЦІЯ ДЛЯ ➕ / ➖ (і для карток, і для таблиці)
  const handler = (e) => {
    const addBtn = e.target.closest("[data-add], [data-add-btn]");
    if (addBtn) {
      const id = addBtn.dataset.add || addBtn.dataset.addBtn;
      if (id) openQtyModal(id, "add");
      return;
    }

    const useBtn = e.target.closest("[data-use], [data-use-btn]");
    if (useBtn) {
      const id = useBtn.dataset.use || useBtn.dataset.useBtn;
      if (id) openQtyModal(id, "consume");
      return;
    }
  };

  // iOS: інколи click може не приходити як очікується
  root.addEventListener("click", handler, true);
  root.addEventListener("pointerup", handler, true);
  root.addEventListener("touchend", handler, true);

  // 2) МОДАЛКА: закриття/підтвердження/таби
  const closeBtn = qs("#modalCloseBtn");
  const cancelBtn = qs("#modalCancelBtn");
  const confirmBtn = qs("#modalConfirmBtn");
  const backdrop = qs("#warehouseModal .modal-backdrop");

  if (closeBtn) closeBtn.addEventListener("click", closeQtyModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeQtyModal);
  if (backdrop) backdrop.addEventListener("click", closeQtyModal);
  if (confirmBtn) confirmBtn.addEventListener("click", confirmQtyModal);

  root.addEventListener(
    "click",
    (e) => {
      const tab = e.target.closest("#warehouseModal .modal-tabs .tab");
      if (!tab) return;

      const action = tab.dataset.action;
      if (action !== "add" && action !== "consume") return;

      setModalAction(action);
    },
    true
  );
}

/* =======================================
   ВИБІР РЕЖИМУ ВІДОБРАЖЕННЯ
======================================= */
function renderFeedWarehouse() {
  const cardsBox = qs("#warehouseFeedCards");
  const tableBody = qs("#warehouseFeedTableBody");

  if (cardsBox) renderFeedCards(cardsBox);
  else if (tableBody) renderFeedTable(tableBody);
}

/* =======================================
   СТАРА ТАБЛИЦЯ (РЕЗЕРВ)
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
        <td><button class="primary" type="button" data-add-btn="${c.id}">➕</button></td>
        <td><button class="danger" type="button" data-use-btn="${c.id}">➖</button></td>
      </tr>
      `
    );
  });
}

/* =======================================
   КАРТКИ КОМПОНЕНТІВ
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

        <div class="warehouse-bar">
          <div class="warehouse-bar__fill" style="width:${percent}%"></div>
        </div>

        <div class="actions">
          <button class="btn small primary" type="button" data-add="${c.id}" title="Додати">➕</button>
          <button class="btn small danger" type="button" data-use="${c.id}" title="Списати">➖</button>
        </div>
      </div>
      `
    );
  });

  box.insertAdjacentHTML(
    "beforeend",
    `
    <div class="warehouse-footer">
      <div class="warehouse-footer__info">
        <div class="warehouse-footer__title">Загальний залишок корму</div>
        <div class="warehouse-footer__value"><b>${totalStock.toFixed(2)}</b> кг</div>
        <div class="muted" style="font-size:12px">
          Списання за рецептом виконується через кнопку «Замішати корм»
        </div>
      </div>

      <div class="warehouse-footer__actions">
        <button class="btn primary" type="button" id="mixFeedBtn">🌾 Замішати корм</button>
        <button class="btn danger" type="button" id="consumeFeedBtn" disabled title="Тимчасово недоступно">
          ➖ Списати корм
        </button>
      </div>
    </div>
    `
  );
}

/* =======================================
   МОДАЛЬНЕ ВІКНО (#warehouseModal)
======================================= */
function openQtyModal(componentId, action) {
  const component = getFeedComponents().find((c) => c.id === componentId);
  if (!component) return;

  const modal = qs("#warehouseModal");
  const titleEl = qs("#modalTitle");
  const stockEl = qs("#modalStock");
  const amountEl = qs("#modalAmount");

  if (!modal || !titleEl || !stockEl || !amountEl) {
    alert("❌ Не знайдено модальне вікно складу. Перевір #warehouseModal у index.html.");
    return;
  }

  modalComponentId = componentId;

  titleEl.textContent = component.name;
  stockEl.textContent = `Поточний залишок: ${getFeedStock(componentId).toFixed(2)} кг`;
  amountEl.value = "1";

  setModalAction(action);

  modal.classList.remove("hidden");
}

function closeQtyModal() {
  const modal = qs("#warehouseModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modalComponentId = null;
}

function setModalAction(action) {
  modalAction = action;

  const modal = qs("#warehouseModal");
  if (!modal) return;

  const tabs = modal.querySelectorAll(".modal-tabs .tab");
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.action === action));
}

function confirmQtyModal() {
  const amountEl = qs("#modalAmount");
  if (!amountEl || !modalComponentId) return;

  const val = Number(amountEl.value || 0);
  if (val <= 0) return;

  if (modalAction === "add") {
    addFeedStock(modalComponentId, val);
  } else {
    if (!consumeFeedStock(modalComponentId, val)) {
      alert("❌ Недостатньо компонента на складі");
      return;
    }
  }

  saveState();
  closeQtyModal();
  renderWarehouse();
}

/* =======================================
   ЛОТКИ ТА ПОПЕРЕДЖЕННЯ
======================================= */
function renderEggTraysBlock() {
  const box = qs("#eggTraysContent");
  if (!box) return;

  const stats = calcTrayStats(AppState || {});
  const deficit = Math.max((stats.reservedTrays || 0) - (stats.availableTrays || 0), 0);

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