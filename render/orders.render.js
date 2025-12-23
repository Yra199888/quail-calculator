/**
 * orders.render.js
 * ---------------------------------------
 * ❌ без бізнес-логіки
 * ❌ без saveState
 * ❌ без Firebase
 * ❌ без мутації AppState
 *
 * ✅ ТІЛЬКИ UI
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

const STATUS_LABELS = {
  reserved: "🟡 Заброньовано",
  done: "🟢 Виконано",
  canceled: "🔴 Скасовано"
};

export function renderOrders() {
  const tbody = qs("#ordersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const orders = AppState.orders?.list ?? [];

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="muted">Немає замовлень</td>
      </tr>
    `;
    return;
  }

  orders.forEach(order => {
    const status = order.status ?? "reserved";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.date ?? "—"}</td>
      <td>${order.client ?? "—"}</td>
      <td>${Number(order.trays || 0)}</td>
      <td>${STATUS_LABELS[status] ?? status}</td>
      <td>${order.details ?? ""}</td>
      <td>
        ${
          status === "reserved"
            ? `
              <button
                data-order-done="${order.id}"
                title="Позначити як виконано"
              >✔</button>

              <button
                data-order-cancel="${order.id}"
                title="Скасувати"
              >✖</button>
            `
            : "—"
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
}