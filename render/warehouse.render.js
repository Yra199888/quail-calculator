/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * БЕЗПЕЧНА ВЕРСІЯ:
 *  - не ламає стару таблицю
 *  - не ламає модалку
 *  - кнопки ➕ / ➖ працюють через делегацію
 *  - всі заголовки українською
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

  if (cardsBox) renderFeedCards(cardsBox);
  else if (tableBody) renderFeedTable(tableBody);
}

/* =======================================
   СТАРА ТАБЛИЦЯ (РЕЗЕРВ)
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
        <td><button class="primary" data-add="${c.id}">➕</button></td>
        <td><button class="danger" data-use="${c.id}">➖</button></td>
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

  components.forEach(c => {
    const stock = getFeedStock(c.id);
    totalStock += stock;

    box.insertAdjacentHTML(
      "beforeend",
      `
      <div class="warehouse-card">
        <div class="row">
          <div class="name">${c.name}</div>
          <div class="stock">${stock.toFixed(2)} кг</div>
        </div>

        <div class="actions">
          <button class="btn small primary" data-add="${c.id}">➕</button>
          <button class="btn small danger" data-use="${c.id}">➖</button>
        </div>
      </div>
      `
    );
  });

  box.insertAdjacentHTML(
    "beforeend",
    `
    <div class="warehouse-footer">
      <div>
        <b>Загальний залишок корму:</b> ${totalStock.toFixed(2)} кг
      </div>
      <button class="btn primary" id="mixFeedBtn">🌾 Замішати корм</button>
    </div>
    `
  );
}

/* =======================================
   ДЕЛЕГАЦІЯ ПОДІЙ (КЛЮЧОВИЙ ФІКС)
======================================= */
document.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    openQtyModal(addBtn.dataset.add, "add");
    return;
  }

  const useBtn = e.target.closest("[data-use]");
  if (useBtn) {
    openQtyModal(useBtn.dataset.use, "consume");
    return;
  }
});

/* =======================================
   МОДАЛЬНЕ ВІКНО
======================================= */
function openQtyModal(componentId, action) {
  const component = getFeedComponents().find(c => c.id === componentId);
  if (!component) return;

  let modal = qs("#qtyModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "qtyModal";
    document.body.appendChild(modal);
  }

  modalComponentId = componentId;
  modalAction = action;

  modal.className = "";
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card">
      <div class="modal-head">
        <div class="modal-title">${component.name}</div>
        <button id="qtyModalClose">✕</button>
      </div>
      <div class="modal-body">
        <label>${action === "add" ? "Скільки додати (кг)" : "Скільки списати (кг)"}</label>
        <input id="qtyModalInput" type="number" value="1" min="0.1" step="0.1">
      </div>
      <div class="modal-actions">
        <button id="qtyModalCancel">Скасувати</button>
        <button id="qtyModalConfirm">OK</button>
      </div>
    </div>
  `;

  qs("#qtyModalClose").onclick = closeQtyModal;
  qs("#qtyModalCancel").onclick = closeQtyModal;
  qs("#qtyModalConfirm").onclick = confirmQtyModal;
}

function closeQtyModal() {
  const modal = qs("#qtyModal");
  if (!modal) return;
  modal.innerHTML = "";
  modal.className = "hidden";
  modalComponentId = null;
}

function confirmQtyModal() {
  const val = Number(qs("#qtyModalInput")?.value || 0);
  if (val <= 0 || !modalComponentId) return;

  if (modalAction === "add") addFeedStock(modalComponentId, val);
  else if (!consumeFeedStock(modalComponentId, val)) {
    alert("❌ Недостатньо корму на складі");
    return;
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
  box.innerHTML = `📦 Повних: ${stats.totalTrays}`;
}

function renderTraysBlock() {
  const valueEl = qs("#emptyTraysValue");
  const btn = qs("#addEmptyTraysBtn");
  const input = qs("#addEmptyTraysInput");
  if (!valueEl || !btn || !input) return;

  valueEl.textContent = getEmptyTrays();
  btn.onclick = () => {
    const v = Number(input.value || 0);
    if (v > 0) {
      addEmptyTrays(v);
      saveState();
      renderWarehouse();
    }
  };
}

function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  const warnings = getWarehouseWarnings();
  box.innerHTML = warnings.length
    ? warnings.map(w => `⚠️ ${w.name}`).join("<br>")
    : "✅ Склад у нормі";
}