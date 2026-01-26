/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * БЕЗПЕЧНА ВЕРСІЯ:
 *  - не ламає стару таблицю
 *  - працює з існуючою модалкою #warehouseModal
 *  - кнопки ➕ / ➖ стабільно працюють (делегація подій)
 *  - прибирає дублювання (картки vs таблиця)
 *  - без бізнес-логіки рецептів (поки що)
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
   ВНУТРІШНІ ПРАПОРЦІ (ЩОБ НЕ ДУБЛЮВАТИ ОБРОБНИКИ)
======================================= */
let isWarehouseDelegationBound = false;
let isWarehouseModalBound = false;

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
  bindWarehouseModalOnce();
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
    // показати картки
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
======================================= */
function bindWarehouseDelegationOnce() {
  if (isWarehouseDelegationBound) return;
  isWarehouseDelegationBound = true;

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add],[data-add-btn]");
    const useBtn = e.target.closest("[data-use],[data-use-btn]");

    if (!addBtn && !useBtn) return;

    const componentId =
      (addBtn?.dataset.add || addBtn?.dataset.addBtn) ??
      (useBtn?.dataset.use || useBtn?.dataset.useBtn);

    if (!componentId) return;

    const action = addBtn ? "add" : "consume";
    openWarehouseModal(componentId, action);
  });
}

/* =======================================
   МОДАЛКА СКЛАДУ (ПРИВ’ЯЗКА 1 РАЗ)
======================================= */
function bindWarehouseModalOnce() {
  if (isWarehouseModalBound) return;
  isWarehouseModalBound = true;

  // закриття
  document.addEventListener("click", (e) => {
    const close =
      e.target.closest("#modalCloseBtn") ||
      e.target.closest("#modalCancelBtn") ||
      e.target.closest("#warehouseModal .modal-backdrop");

    if (!close) return;

    const modal = document.getElementById("warehouseModal");
    if (modal) modal.classList.add("hidden");
  });

  // перемикання вкладок
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("#warehouseModal .modal-tabs .tab");
    if (!tab) return;

    const action = tab.dataset.action;
    if (action !== "add" && action !== "consume") return;

    AppState.ui ||= {};
    AppState.ui.warehouseModal ||= {};
    AppState.ui.warehouseModal.action = action;

    const modal = document.getElementById("warehouseModal");
    if (!modal) return;

    modal.querySelectorAll(".modal-tabs .tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.action === action);
    });

    const stockEl = document.getElementById("modalStock");
    const componentId = AppState.ui?.warehouseModal?.componentId;
    if (stockEl && componentId) {
      stockEl.textContent = `Поточний залишок: ${getFeedStock(componentId).toFixed(2)} кг`;
    }
  });

  // підтвердження
  document.addEventListener("click", (e) => {
    const okBtn = e.target.closest("#modalConfirmBtn");
    if (!okBtn) return;

    const modal = document.getElementById("warehouseModal");
    const amountEl = document.getElementById("modalAmount");
    const ui = AppState.ui?.warehouseModal;

    if (!modal || !amountEl || !ui?.componentId) {
      alert("❌ Не вдалося виконати дію складу (немає даних модалки).");
      return;
    }

    const val = Number(amountEl.value || 0);
    if (!(val > 0)) return;

    const action = ui.action || "add";

    if (action === "add") {
      addFeedStock(ui.componentId, val);
    } else {
      const ok = consumeFeedStock(ui.componentId, val);
      if (!ok) {
        alert("❌ Недостатньо компонента на складі");
        return;
      }
    }

    saveState();
    modal.classList.add("hidden");
    renderWarehouse();
  });
}

/* =======================================
   ВІДКРИТТЯ МОДАЛКИ СКЛАДУ
======================================= */
function openWarehouseModal(componentId, action) {
  const modal = document.getElementById("warehouseModal");
  const titleEl = document.getElementById("modalTitle");
  const stockEl = document.getElementById("modalStock");
  const amountEl = document.getElementById("modalAmount");

  if (!modal || !titleEl || !stockEl || !amountEl) {
    alert("❌ Модальне вікно складу не знайдено (#warehouseModal).");
    return;
  }

  const component = (getFeedComponents() || []).find((c) => c.id === componentId);
  if (!component) {
    alert("❌ Компонент не знайдено.");
    return;
  }

  AppState.ui ||= {};
  AppState.ui.warehouseModal ||= {};
  AppState.ui.warehouseModal.componentId = componentId;
  AppState.ui.warehouseModal.action = action;

  titleEl.textContent = component.name;
  stockEl.textContent = `Поточний залишок: ${getFeedStock(componentId).toFixed(2)} кг`;
  amountEl.value = "1";

  modal.querySelectorAll(".modal-tabs .tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.action === action);
  });

  modal.classList.remove("hidden");
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