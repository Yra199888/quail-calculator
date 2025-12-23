/**
 * orders.render.js
 * ---------------------------------------
 * ❌ без бізнес-логіки
 * ❌ без saveState
 * ❌ без Firebase
 * ✅ тільки UI
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";
import { calcTrayStats } from "../utils/trays.calc.js";

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

  // 🧮 поточні лотки на складі
  const trayStats = calcTrayStats(AppState);
  let available = trayStats.availableTrays;

  orders.forEach(order => {
    const status = order.status ?? "reserved";
    const trays = Number(order.trays || 0);

    let note = order.details ?? "";
    let shortage = 0;

    // ❗ показуємо дефіцит ТІЛЬКИ для заброньованих
    if (status === "reserved") {
      if (available >= trays) {
        available -= trays;
      } else {
        shortage = trays - available;
        available = 0;
      }
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.date ?? "—"}</td>
      <td>${order.client ?? "—"}</td>
      <td>
        ${trays}
        ${shortage > 0
          ? `<div class="text-warning">❗ бракує ${shortage}</div>`
          : ""}
      </td>
      <td>${STATUS_LABELS[status] ?? status}</td>
      <td>${note}</td>
      <td>
        ${status === "reserved"
          ? `
            <button data-order-done="${order.id}">✔</button>
            <button data-order-cancel="${order.id}">✖</button>
          `
          : "—"}
      </td>
    `;

    tbody.appendChild(tr);
  });
}