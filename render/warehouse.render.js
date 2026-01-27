/**
 * warehouse.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення складу
 *
 * INLINE-ВЕРСІЯ (БЕЗ МОДАЛКИ):
 *  - кнопки ➕ / ➖ відкривають inline-ввід (без popup/alert-заглушок)
 *  - один обробник подій (делегація)
 *  - прибирає дублювання (картки vs таблиця)
 *  - НЕ чіпає інші вкладки/логіку
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
   INLINE STATE (UI)
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

    if (tableEl) tableEl.style.display = "none";
    if (tableBody) tableBody.innerHTML = "";

    renderFeedCards(cardsBox);
    return;
  }

  if (hasTable) {
    if (tableEl) tableEl.style.display = "";
    renderFeedTable(tableBody);
  }
}

/* =======================================
   СТАРА ТАБЛИЦЯ (РЕЗЕРВНИЙ ВАРІАНТ)
   - також підтримує inline-ввід
======================================= */
function renderFeedTable(tbody) {
  tbody.innerHTML = "";

  getFeedComponents().forEach((c) => {
    const stock = getFeedStock(c.id);
    const isOpen = isInlineOpenFor(c.id);
    const ui = getInlineState();
    const action = isOpen ? (ui?.action || "add") : "add";
    const defaultVal = isOpen ? String(ui?.value ?? "1") : "1";

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-row-id="${c.id}">
        <td>${c.name}</td>
        <td>${stock.toFixed(2)}</td>
        <td><button class="primary" data-add-btn="${c.id}" type="button">➕</button></td>
        <td><button class="danger" data-use-btn="${c.id}" type="button">➖</button></td>
      </tr>

      <tr data-inline-row="${c.id}" style="${isOpen ? "" : "display:none;"}">
        <td colspan="4">
          <div class="warehouse-inline" style="display:flex; gap:8px; align-items:center; padding:10px; border:1px solid var(--border-color); border-radius:12px; background: var(--bg-panel);">
            <div style="font-weight:700;">
              ${action === "add" ? "➕ Додати" : "➖ Списати"}
            </div>

            <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
              <label class="muted" style="font-size:12px;">Кількість (кг)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value="${escapeHtml(defaultVal)}"
                data-inline-input="${c.id}"
                style="width:120px;"
              />
              <button class="btn ghost" data-inline-cancel="${c.id}" type="button">Скасувати</button>
              <button class="btn primary" data-inline-ok="${c.id}" type="button">OK</button>
            </div>
          </div>
        </td>
      </tr>
      `
    );
  });
}

/* =======================================
   КАРТКИ КОМПОНЕНТІВ СКЛАДУ
   - inline-ввід прямо в картці
======================================= */
function renderFeedCards(box) {
  box.innerHTML = "";

  const components = getFeedComponents();
  let totalStock = 0;

  components.forEach((c) => {
    const stock = getFeedStock(c.id);
    totalStock += stock;

    const percent = Math.min(100, (stock / 10) * 100);

    const isOpen = isInlineOpenFor(c.id);
    const ui = getInlineState();
    const action = isOpen ? (ui?.action || "add") : "add";
    const defaultVal = isOpen ? String(ui?.value ?? "1") : "1";

    box.insertAdjacentHTML(
      "beforeend",
      `
      <div class="warehouse-card" data-card-id="${c.id}">
        <div class="row">
          <div class="name">${c.name}</div>
          <div class="stock">${stock.toFixed(2)} кг</div>
        </div>

        <div class="warehouse-bar" style="margin-top:10px; border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
          <div class="warehouse-bar__fill" style="height:8px; width:${percent}%; background: rgba(76,175,80,0.65);"></div>
        </div>

        <div class="actions" style="margin-top:10px; display:flex; gap:8px; align-items:center;">
          <button class="btn small primary" data-add="${c.id}" title="Додати" type="button">➕</button>
          <button class="btn small danger" data-use="${c.id}" title="Списати" type="button">➖</button>

          ${
            isOpen
              ? `
                <div class="warehouse-inline" style="margin-left:auto; display:flex; gap:8px; align-items:center;">
                  <div style="font-weight:700;">
                    ${action === "add" ? "➕" : "➖"}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value="${escapeHtml(defaultVal)}"
                    data-inline-input="${c.id}"
                    style="width:110px;"
                    placeholder="кг"
                  />
                  <button class="btn ghost" data-inline-cancel="${c.id}" type="button">Скасувати</button>
                  <button class="btn primary" data-inline-ok="${c.id}" type="button">OK</button>
                </div>
              `
              : ``
          }
        </div>
      </div>
      `
    );
  });

  // нижній блок
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
   - відкриття inline (➕ / ➖)
   - OK / Скасувати
======================================= */
function bindWarehouseDelegationOnce() {
  if (isWarehouseDelegationBound) return;
  isWarehouseDelegationBound = true;

  document.addEventListener("click", (e) => {
    // -------------------------
    // ВІДКРИТИ INLINE (➕ / ➖)
    // -------------------------
    const addBtn = e.target.closest("[data-add],[data-add-btn]");
    const useBtn = e.target.closest("[data-use],[data-use-btn]");

    if (addBtn || useBtn) {
      const componentId =
        (addBtn?.dataset.add || addBtn?.dataset.addBtn) ??
        (useBtn?.dataset.use || useBtn?.dataset.useBtn);

      if (!componentId) return;

      const action = addBtn ? "add" : "consume";

      // якщо вже відкрите на цьому компоненті — просто переключимо дію
      const current = getInlineState();
      if (current?.componentId === componentId) {
        setInlineState({ ...current, action });
      } else {
        setInlineState({ componentId, action, value: "1" });
      }

      saveState();
      renderWarehouse();

      // фокус на інпут
      setTimeout(() => {
        const input = document.querySelector(`[data-inline-input="${cssEscape(componentId)}"]`);
        if (input) {
          input.focus();
          input.select?.();
        }
      }, 0);

      return;
    }

    // -------------------------
    // СКАСУВАТИ INLINE
    // -------------------------
    const cancelBtn = e.target.closest("[data-inline-cancel]");
    if (cancelBtn) {
      setInlineState(null);
      saveState();
      renderWarehouse();
      return;
    }

    // -------------------------
    // OK INLINE
    // -------------------------
    const okBtn = e.target.closest("[data-inline-ok]");
    if (okBtn) {
      const componentId = okBtn.dataset.inlineOk;
      if (!componentId) return;

      const ui = getInlineState();
      if (!ui || ui.componentId !== componentId) return;

      const input = document.querySelector(`[data-inline-input="${cssEscape(componentId)}"]`);
      const val = Number(input?.value || ui.value || 0);

      if (!(val > 0)) return;

      if (ui.action === "add") {
        addFeedStock(componentId, val);
      } else {
        const ok = consumeFeedStock(componentId, val);
        if (!ok) {
          alert("❌ Недостатньо компонента на складі");
          return;
        }
      }

      setInlineState(null);
      saveState();
      renderWarehouse();
      return;
    }
  });

  // Enter = OK, Escape = Cancel (для inline input)
  document.addEventListener("keydown", (e) => {
    const input = e.target?.closest?.("[data-inline-input]");
    if (!input) return;

    const componentId = input.dataset.inlineInput;
    if (!componentId) return;

    if (e.key === "Escape") {
      setInlineState(null);
      saveState();
      renderWarehouse();
      return;
    }

    if (e.key === "Enter") {
      const ui = getInlineState();
      if (!ui || ui.componentId !== componentId) return;

      const val = Number(input.value || 0);
      if (!(val > 0)) return;

      if (ui.action === "add") {
        addFeedStock(componentId, val);
      } else {
        const ok = consumeFeedStock(componentId, val);
        if (!ok) {
          alert("❌ Недостатньо компонента на складі");
          return;
        }
      }

      setInlineState(null);
      saveState();
      renderWarehouse();
      return;
    }
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

/* =======================================
   HELPERS
======================================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// простий escape для querySelector по data-атрибуту
function cssEscape(v) {
  // мінімально достатньо для id типу "corn", "custom_123"
  return String(v).replaceAll('"', '\\"');
}