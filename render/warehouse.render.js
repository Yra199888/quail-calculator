/**
 * warehouse.render.js
 * ---------------------------------------
 * ВІДПОВІДАЄ ТІЛЬКИ ЗА ВІДОБРАЖЕННЯ СКЛАДУ
 *
 * INLINE-ВВІД (АКУРАТНИЙ UI):
 *  - одночасно відкритий ТІЛЬКИ ОДИН компонент
 *  - компактна верстка, ок для мобільних
 *  - без впливу на інші вкладки
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
let isDelegationBound = false;

/* =======================================
   ГОЛОВНИЙ РЕНДЕР
======================================= */
export function renderWarehouse() {
  renderFeedWarehouse();
  renderEggTraysBlock();
  renderTraysBlock();
  renderWarehouseWarnings();
  renderLogs();

  bindDelegationOnce();
}

/* =======================================
   INLINE UI STATE (ТІЛЬКИ 1 ВІДКРИТИЙ)
======================================= */
function getInline() {
  return AppState.ui?.warehouseInline || null;
}

function openInline(componentId, action = "add") {
  AppState.ui ||= {};
  AppState.ui.warehouseInline = {
    componentId,
    action,
    value: "1"
  };
}

function closeInline() {
  if (AppState.ui) AppState.ui.warehouseInline = null;
}

function isInline(componentId) {
  return getInline()?.componentId === componentId;
}

/* =======================================
   ВИБІР РЕЖИМУ ВІДОБРАЖЕННЯ
======================================= */
function renderFeedWarehouse() {
  const cardsBox = qs("#warehouseFeedCards");
  const tableBody = qs("#warehouseFeedTableBody");

  if (cardsBox) {
    cardsBox.style.display = "";
    if (tableBody) tableBody.innerHTML = "";
    renderCards(cardsBox);
    return;
  }

  if (tableBody) renderTable(tableBody);
}

/* =======================================
   КАРТКИ СКЛАДУ (INLINE АКУРАТНИЙ)
======================================= */
function renderCards(box) {
  box.innerHTML = "";

  getFeedComponents().forEach(c => {
    const stock = getFeedStock(c.id);
    const inline = isInline(c.id);
    const ui = getInline();

    box.insertAdjacentHTML("beforeend", `
      <div class="warehouse-card">
        <div class="row">
          <div class="name">${c.name}</div>
          <div class="stock">${stock.toFixed(2)} кг</div>
        </div>

        <div class="actions">
          <button class="btn small primary" data-add="${c.id}">➕</button>
          <button class="btn small danger" data-use="${c.id}">➖</button>
        </div>

        ${inline ? renderInline(c.id, ui.action, ui.value) : ""}
      </div>
    `);
  });

  renderFooter(box);
}

function renderInline(id, action, value) {
  return `
    <div class="warehouse-inline">
      <span class="inline-label">
        ${action === "add" ? "➕ Додати" : "➖ Списати"}
      </span>

      <input
        type="number"
        step="0.1"
        min="0"
        value="${escapeHtml(value)}"
        data-inline-input="${id}"
      />

      <button class="btn ghost" data-inline-cancel>Скасувати</button>
      <button class="btn primary" data-inline-ok="${id}">OK</button>
    </div>
  `;
}

/* =======================================
   НИЖНІЙ БЛОК
======================================= */
function renderFooter(box) {
  box.insertAdjacentHTML("beforeend", `
    <div class="warehouse-footer">
      <div>
        <div class="title">Загальний залишок корму</div>
        <div class="value">
          ${getFeedComponents()
            .reduce((s,c)=>s+getFeedStock(c.id),0)
            .toFixed(2)} кг
        </div>
        <div class="hint">
          Списання за рецептом — через «Замішати корм»
        </div>
      </div>

      <button class="btn primary" id="mixFeedBtn">🌾 Замішати корм</button>
    </div>
  `);
}

/* =======================================
   ДЕЛЕГАЦІЯ (1 РАЗ)
======================================= */
function bindDelegationOnce() {
  if (isDelegationBound) return;
  isDelegationBound = true;

  document.addEventListener("click", e => {
    // ➕ / ➖
    const add = e.target.closest("[data-add]");
    const use = e.target.closest("[data-use]");
    if (add || use) {
      const id = add?.dataset.add || use?.dataset.use;
      openInline(id, add ? "add" : "consume");
      saveState();
      renderWarehouse();
      return;
    }

    // Скасувати
    if (e.target.closest("[data-inline-cancel]")) {
      closeInline();
      saveState();
      renderWarehouse();
      return;
    }

    // OK
    const ok = e.target.closest("[data-inline-ok]");
    if (ok) {
      const id = ok.dataset.inlineOk;
      const input = document.querySelector(`[data-inline-input="${cssEscape(id)}"]`);
      const val = Number(input?.value || 0);
      if (val <= 0) return;

      const action = getInline()?.action;
      if (action === "add") addFeedStock(id, val);
      else if (!consumeFeedStock(id, val)) {
        alert("❌ Недостатньо компонента");
        return;
      }

      closeInline();
      saveState();
      renderWarehouse();
    }
  });
}

/* =======================================
   ЛОТКИ + ПОПЕРЕДЖЕННЯ
======================================= */
function renderEggTraysBlock() {
  const box = qs("#eggTraysContent");
  if (!box) return;

  const s = calcTrayStats(AppState || {});
  const deficit = Math.max(s.reservedTrays - s.availableTrays, 0);

  box.innerHTML = `
    <div class="egg-trays ${deficit ? "danger":"ok"}">
      📦 ${s.totalTrays} | 🟡 ${s.reservedTrays} | 🟢 ${s.availableTrays}
    </div>
  `;
}

function renderTraysBlock() {
  const v = qs("#emptyTraysValue");
  const b = qs("#addEmptyTraysBtn");
  const i = qs("#addEmptyTraysInput");
  if (!v||!b||!i) return;

  v.textContent = getEmptyTrays();
  b.onclick = () => {
    const n = Number(i.value||0);
    if (n>0) {
      addEmptyTrays(n);
      saveState();
      renderWarehouse();
    }
  };
}

function renderWarehouseWarnings() {
  const box = qs("#warehouseWarnings");
  if (!box) return;
  const w = getWarehouseWarnings();
  box.innerHTML = w.length
    ? w.map(x=>`⚠️ ${x.name}: ${x.stock}/${x.min}`).join("<br>")
    : "✅ Склад у нормі";
}

/* =======================================
   HELPERS
======================================= */
function escapeHtml(v){return String(v).replaceAll('"',"&quot;")}
function cssEscape(v){return String(v).replaceAll('"','\\"')}