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

  // 🧮 Статистика по лотках
  const trayStats = calcTrayStats(AppState);
  let remainingAvailable = Number(trayStats.availableTrays || 0);

  orders.forEach(order => {
    const status = order.status ?? "reserved";
    const trays = Number(order.trays || 0);

    let deficit = 0;

    // ❗ дефіцит рахуємо ТІЛЬКИ для активних броней
    if (status === "reserved") {
      if (trays > remainingAvailable) {
        deficit = trays - remainingAvailable;
        remainingAvailable = 0;
      } else {
        remainingAvailable -= trays;
      }
    }

    const tr = document.createElement("tr");

    // 🟥 підсвітка якщо дефіцит
    if (deficit > 0) {
      tr.style.background = "rgba(229, 57, 53, 0.12)";
    }

    tr.innerHTML = `
      <td>${order.date ?? "—"}</td>
      <td>${order.client ?? "—"}</td>
      <td>
        ${trays}
        ${
          deficit > 0
            ? `<div style="color:#e53935;font-size:12px">
                 ⚠ Дефіцит ${deficit}
               </div>`
            : ""
        }
      </td>
      <td>${STATUS_LABELS[status] ?? status}</td>
      <td>${order.details ?? ""}</td>
      <td>
        ${
          status === "reserved"
            ? `
              <button data-order-done="${order.id}">✔</button>
              <button data-order-cancel="${order.id}">✖</button>
            `
            : "—"
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
}