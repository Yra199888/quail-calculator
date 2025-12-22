/**
 * orders.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення замовлень:
 *  - список замовлень
 *  - базова інформація (дата, клієнт, лотки, примітка)
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ localStorage
 * ❌ БЕЗ мутації AppState
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

// =======================================
// ГОЛОВНИЙ РЕНДЕР
// =======================================
export function renderOrders() {
  const tbody = qs("#ordersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const orders = AppState.orders.list || [];

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="muted">Немає замовлень</td>
      </tr>
    `;
    return;
  }

  orders.forEach(order => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.date}</td>
      <td>${order.client}</td>
      <td>${order.trays}</td>
      <td>${order.details || ""}</td>
    `;

    tbody.appendChild(tr);
  });
}