/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * БЕЗПЕЧНА ВЕРСІЯ:
 *  - не ламає стару таблицю
 *  - не ламає модалку
 *  - кнопки ➕ / ➖ стабільно працюють
 *  - кнопки мають кольорову семантику
 *  - без бізнес-логіки
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
   СТАН МОДАЛЬНОГО ВІКНА
======================================= */
let modalComponentId = null;
let modalAction = "add";

/* =======================================
   ГОЛОВНИЙ РЕНДЕР СКЛАДУ
======================================= */
export function renderWarehouse() {
  renderFeedWarehouse();
  renderEggTraysBlock();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs();
}

/* =======================================
   ВИБІР РЕЖИМУ ВІДОБРАЖЕННЯ
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
   СТАРА ТАБЛИЦЯ (РЕЗЕРВНИЙ ВАРІАНТ)
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
        <td><button class="primary" data-add-btn="${c.id}">➕</button></td>
        <td><button class="danger" data-use-btn="${c.id}">➖</button></td>
      </tr>
      `
    );
  });

  bindTableActions();
}

function bindTableActions() {
  qsa("[data-add-btn]").forEach(btn => {
    btn.onclick = () => openQtyModal(btn.dataset.addBtn, "add");
  });

  qsa("[data-use-btn]").forEach(btn => {
    btn.onclick = () => openQtyModal(btn.dataset.useBtn, "consume");
  });
}

/* =======================================
   КАРТКИ КОМПОНЕНТІВ СКЛАДУ
======================================= */
function renderFeedCards(box) {
  box.innerHTML = "";

  const components = getFeedComponents();
  let totalStock = 0;

  components.forEach(c => {
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
          <button class="btn small primary" data-add="${c.id}" title="Додати">➕</button>
          <button class="btn small danger" data-use="${c.id}" title="Списати">➖</button>
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
        <div class="warehouse-footer__value">
          <b>${totalStock.toFixed(2)}</b> кг
        </div>
        <div class="muted" style="font-size:12px">
          Списання за рецептом виконується через кнопку «Замішати корм»
        </div>
      </div>

      <div class="warehouse-footer__actions">
        <button class="btn primary" id="mixFeedBtn">🌾 Замішати корм</button>
        <button class="btn danger" id="consumeFeedBtn" disabled title="Тимчасово недоступно">
          ➖ Списати корм
        </button>
      </div>
    </div>
    `
  );

  bindCardActions();
}

/* =======================================
   ДІЇ НА КАРТКАХ КОМПОНЕНТІВ
======================================= */
function bindCardActions() {
  qsa("[data-add]").forEach(btn => {
    btn.onclick = () => openQtyModal(btn.dataset.add, "add");
  });

  qsa("[data-use]").forEach(btn => {
    btn.onclick = () => openQtyModal(btn.dataset.use, "consume");
  });
}

/* =======================================
   ЛОГІКА МОДАЛЬНОГО ВІКНА
======================================= */
function openQtyModal(componentId, action) {
  const component = getFeedComponents().find(c => c.id === componentId);
  if (!component) return;

  modalComponentId = componentId;
  modalAction = action;

  const modal = qs("#qtyModal");
  modal.classList.remove("hidden");

  modal.innerHTML = `
    <div class="modal">
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <div class="modal-head">
          <div class="modal-title">${component.name}</div>
          <button class="modal-x" id="qtyModalClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="modal-subtitle">
            Поточний залишок: ${getFeedStock(componentId).toFixed(2)} кг
          </div>

          <label class="modal-label">
            ${action === "add" ? "Скільки додати (кг)" : "Скільки списати (кг)"}
          </label>
          <input
            type="number"
            id="qtyModalInput"
            class="modal-input"
            value="1"
            min="0.1"
            step="0.1"
          >
        </div>

        <div class="modal-actions">
          <button class="btn ghost" id="qtyModalCancel">Скасувати</button>
          <button class="btn primary" id="qtyModalConfirm">OK</button>
        </div>
      </div>
    </div>
  `;

  qs("#qtyModalClose").onclick = closeQtyModal;
  qs("#qtyModalCancel").onclick = closeQtyModal;
  qs("#qtyModalConfirm").onclick = confirmQtyModal;
}

function closeQtyModal() {
  qs("#qtyModal").classList.add("hidden");
  qs("#qtyModal").innerHTML = "";
  modalComponentId = null;
}

function confirmQtyModal() {
  const val = Number(qs("#qtyModalInput")?.value || 0);
  if (val <= 0 || !modalComponentId) return;

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
    ? warnings.map(w => `⚠️ ${w.name}: ${w.stock} / мін ${w.min}`).join("<br>")
    : "✅ Склад у нормі";
}