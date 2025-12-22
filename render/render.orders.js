/**
 * render.orders.js
 * ---------------------------------------
 * Render-шар замовлень.
 * Відповідає лише за відображення списку та статистики.
 */

import { AppState } from "../state/AppState.js";

/**
 * Головний render замовлень
 */
export function renderOrders() {
  renderOrdersList();
  renderOrdersSummary();
}

/**
 * Список замовлень
 */
function renderOrdersList() {
  const box = document.getElementById("ordersList");
  if (!box) return;

  const list = [...(AppState.orders.list || [])];

  if (!list.length) {
    box.innerHTML = "<i>Замовлень немає</i>";
    return;
  }

  // порядок статусів
  const statusOrder = {
    confirmed: 1,
    delivered: 2,
    cancelled: 3
  };

  list.sort((a, b) => {
    const sa = statusOrder[a.status] || 99;
    const sb = statusOrder[b.status] || 99;
    if (sa !== sb) return sa - sb;
    return (a.date || "") < (b.date || "") ? 1 : -1;
  });

  box.innerHTML = list.map(renderOrderItem).join("");
}

/**
 * Окремий елемент замовлення
 */
function renderOrderItem(order) {
  const { id, date, client, trays, details, status } = order;

  let style = "";
  let badge = "";

  if (status === "confirmed") {
    style = "background:#1b3d1b;border-left:4px solid #4caf50;";
    badge = "🟢 Підтверджено";
  } else if (status === "delivered") {
    style = "background:#2b2b2b;border-left:4px solid #9e9e9e;";
    badge = "⚪ Видано";
  } else if (status === "cancelled") {
    style = "background:#3d1b1b;border-left:4px solid #f44336;";
    badge = "🔴 Скасовано";
  }

  return `
    <div class="order-entry"
         style="padding:10px;margin-bottom:10px;border-radius:6px;${style}">
      <div style="display:flex;justify-content:space-between;gap:10px;">
        <div>
          <b>${date || ""}</b> — <b>${client || ""}</b><br>
          Лотків: <b>${trays}</b><br>
          <small>${details || ""}</small>
        </div>

        <div style="text-align:right;">
          <div><b>${badge}</b></div>

          <div style="margin-top:6px;display:flex;flex-direction:column;gap:6px;">
            ${renderOrderActions(order)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Кнопки дій (тільки HTML, логіка в controller)
 */
function renderOrderActions(order) {
  if (order.status === "confirmed") {
    return `
      <button data-action="deliver" data-id="${order.id}">
        📦 Видано
      </button>
      <button data-action="cancel" data-id="${order.id}">
        ❌ Скасувати
      </button>
    `;
  }

  return `
    <button data-action="delete" data-id="${order.id}">
      🗑️ Видалити
    </button>
  `;
}

/**
 * Підсумок активних замовлень
 */
function renderOrdersSummary() {
  const countEl = document.getElementById("activeOrdersCount");
  const traysEl = document.getElementById("activeOrdersTrays");

  if (!countEl || !traysEl) return;

  const active = (AppState.orders.list || [])
    .filter(o => o.status === "confirmed");

  countEl.textContent = active.length;
  traysEl.textContent = active.reduce(
    (sum, o) => sum + Number(o.trays || 0),
    0
  );
}