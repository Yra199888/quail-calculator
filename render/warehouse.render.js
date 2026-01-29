/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * INLINE-ВЕРСІЯ (БЕЗ МОДАЛКИ):
 *  - кнопки ➕ / ➖ відкривають inline-ввід
 *  - один обробник подій (делегація)
 *  - без дублювання (картки / таблиця)
 *  - не впливає на інші вкладки
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
   ВНУТРІШНІ ПРАПОРЦІ
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
   СТАН INLINE-ВВОДУ
======================================= */
function getInlineState() {
  return AppState.ui?.warehouseInline || null;
}

function setInlineState(next) {
  AppState.ui ||= {};
  AppState.ui.warehouseInline = next || null;
}

function isInlineOpenFor(componentId) {
  const ui = getInlineState();
  return !!ui && ui.componentId === componentId;
}

/* =======================================
   ВИБІР ВІДОБРАЖЕННЯ (КАРТКИ / ТАБЛИЦЯ)
======================================= */
function renderFeedWarehouse() {
  const cardsBox = qs("#warehouseFeedCards");
  const tableBody = qs("#warehouseFeedTableBody");
  const tableEl = tableBody ? tableBody.closest("table") : null;

  if (cardsBox) {
    cardsBox.style.display = "";
    if (tableEl) tableEl.style.display = "none";
    if (tableBody) tableBody.innerHTML = "";
    renderFeedCards(cardsBox);
    return;
  }

  if (tableBody) {
    if (tableEl) tableEl.style.display = "";
    renderFeedTable(tableBody);
  }
}

/* =======================================
   ТАБЛИЦЯ (РЕЗЕРВНИЙ ВАРІАНТ)
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
        <td><button data-add-btn="${c.id}">➕</button></td>
        <td><button data-use-btn="${c.id}">➖</button></td>
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

  components.forEach((c) => {
    const stock = getFeedStock(c.id);
    const percent = Math.min(100, (stock / 10) * 100);
    const isOpen = isInlineOpenFor(c.id);
    const ui = getInlineState();
    const action = isOpen ? (ui?.action || "add") : "add";
    const defaultVal = isOpen ? String(ui?.value ?? "1") : "1";

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
          <button data-add="${c.id}">➕</button>
          <button data-use="${c.id}">➖</button>

          ${
            isOpen
              ? `
              <input type="number" step="0.1"
                value="${escapeHtml(defaultVal)}"
                data-inline-input="${c.id}" />
              <button data-inline-cancel>Скасувати</button>
              <button data-inline-ok="${c.id}">OK</button>
              `
              : ""
          }
        </div>
      </div>
      `
    );
  });

  /* === ВАЖЛИВО: ТІЛЬКИ ЗАМІШАНИЙ КОРМ === */
  const mixedFeedKg = Number(AppState.warehouse?.mixedFeedKg || 0);

  box.insertAdjacentHTML(
    "beforeend",
    `
    <div class="warehouse-footer">
      <div>
        <b>Загальний залишок корму</b><br>
        <span style="font-size:18px">${mixedFeedKg.toFixed(2)} кг</span>
        <div class="muted">
          Показується лише замішаний корм
        </div>
      </div>

      <div>
        <button id="mixFeedBtn">🌾 Замішати корм</button>
        <button disabled>➖ Списати корм</button>
      </div>
    </div>
    `
  );
}

/* =======================================
   ДЕЛЕГАЦІЯ INLINE-ДІЙ
======================================= */
function bindWarehouseDelegationOnce() {
  if (isWarehouseDelegationBound) return;
  isWarehouseDelegationBound = true;

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add],[data-add-btn]");
    const useBtn = e.target.closest("[data-use],[data-use-btn]");

    if (addBtn || useBtn) {
      const componentId =
        addBtn?.dataset.add || addBtn?.dataset.addBtn ||
        useBtn?.dataset.use || useBtn?.dataset.useBtn;

      const action = addBtn ? "add" : "consume";
      setInlineState({ componentId, action, value: "1" });
      saveState();
      renderWarehouse();
      return;
    }

    if (e.target.closest("[data-inline-cancel]")) {
      setInlineState(null);
      saveState();
      renderWarehouse();
      return;
    }

    const okBtn = e.target.closest("[data-inline-ok]");
    if (okBtn) {
      const componentId = okBtn.dataset.inlineOk;
      const input = document.querySelector(`[data-inline-input="${componentId}"]`);
      const val = Number(input?.value || 0);
      if (!(val > 0)) return;

      const ui = getInlineState();
      if (ui?.action === "add") {
        addFeedStock(componentId, val);
      } else {
        if (!consumeFeedStock(componentId, val)) {
          alert("❌ Недостатньо компонента на складі");
          return;
        }
      }

      setInlineState(null);
      saveState();
      renderWarehouse();
    }
  });
}

/* =======================================
   ЛОТКИ
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
    <div class="${deficit > 0 ? "danger" : "ok"}">
      Повних: ${stats.totalTrays} |
      Резерв: ${stats.reservedTrays} |
      Доступно: ${stats.availableTrays}
    </div>
  `;
}

/* =======================================
   ПОРОЖНІ ЛОТКИ
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
   ПОПЕРЕДЖЕННЯ СКЛАДУ
======================================= */
function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;

  const warnings = getWarehouseWarnings();
  box.innerHTML = warnings.length
    ? warnings.map(w => `⚠️ ${w.name}: ${w.stock} / мін ${w.min}`).join("<br>")
    : "✅ Склад у нормі";
}

/* =======================================
   ДОПОМІЖНІ ФУНКЦІЇ
======================================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}