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
  partial: "🟠 Частково",
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
    const trays = Number(order.trays || 0);

    // ✅ fulfilled: якщо немає — вважаємо 0 (старі замовлення)
    const fulfilledRaw = order.fulfilled;
    const fulfilled = typeof fulfilledRaw === "number" ? fulfilledRaw : 0;

    // ✅ Вираховуємо UI-статус, не мутуючи state
    // - canceled/done як є
    // - якщо reserved але вже щось видано -> partial
    // - якщо done але fulfilled немає -> все ок (старий формат)
    let status = order.status ?? "reserved";

    if (status === "reserved" && fulfilled > 0 && fulfilled < trays) status = "partial";
    if (status === "reserved" && trays > 0 && fulfilled >= trays) status = "done";
    if (status === "partial" && trays > 0 && fulfilled >= trays) status = "done";
    if (status === "done" && trays > 0 && fulfilled > trays) status = "done"; // страховка

    // 🟡 активна потреба (скільки ще треба видати)
    const remainingNeed =
      (status === "reserved" || status === "partial")
        ? Math.max(trays - fulfilled, 0)
        : 0;

    // ❗ дефіцит рахуємо ТІЛЬКИ для активних (reserved/partial)
    let deficit = 0;

    if (remainingNeed > 0) {
      if (remainingNeed > remainingAvailable) {
        deficit = remainingNeed - remainingAvailable;
        remainingAvailable = 0;
      } else {
        remainingAvailable -= remainingNeed;
      }
    }

    const tr = document.createElement("tr");

    // 🟥 підсвітка якщо дефіцит
    if (deficit > 0) {
      tr.style.background = "rgba(229, 57, 53, 0.12)";
    }

    // 📦 Показ “видано / замовлено” (не ламає старі: буде 0 / trays)
    const progressHtml =
      trays > 0
        ? `<div style="font-size:12px;color:#9aa0ad;margin-top:2px">
             📦 ${fulfilled}/${trays}
           </div>`
        : "";

    // ⚠️ Дефіцит виводимо, якщо є
    const deficitHtml =
      deficit > 0
        ? `<div style="color:#e53935;font-size:12px;margin-top:2px">
             ⚠ Дефіцит ${deficit}
           </div>`
        : "";

    // 🎛 Кнопки:
    // - done/cancel як було (щоб app.js не зламати)
    // - ship-one (➕1) — під partial (якщо захочеш обробити)
    const actionsHtml =
      (status === "reserved" || status === "partial")
        ? `
          <button data-order-done="${order.id}" title="Виконати повністю">✔</button>
          <button data-order-cancel="${order.id}" title="Скасувати">✖</button>
          <button data-order-ship-one="${order.id}" title="Видати 1 лоток">➕1</button>
        `
        : "—";

    tr.innerHTML = `
      <td>${order.date ?? "—"}</td>
      <td>${order.client ?? "—"}</td>
      <td>
        ${trays}
        ${progressHtml}
        ${deficitHtml}
      </td>
      <td>${STATUS_LABELS[status] ?? status}</td>
      <td>${order.details ?? ""}</td>
      <td>${actionsHtml}</td>
    `;

    tbody.appendChild(tr);
  });
}