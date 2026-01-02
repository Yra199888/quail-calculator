/**
 * logs.render.js
 * ---------------------------------------
 * UI журналу подій складу
 *
 * ❌ без бізнес-логіки
 * ❌ без Firebase
 * ❌ без saveState
 * ✅ тільки відображення + delete-event
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

const LOG_LABELS = {
  "feed:add":        "➕ Додано корм",
  "feed:consume":    "➖ Списано корм",
  "feed:clear":      "🧹 Очищено склад корму",
  "trays:add":       "➕ Додано лотки",
  "trays:reserve":   "🟡 Зарезервовано лотки",
  "trays:release":   "🔓 Знято резерв",
  "warehouse:set-minimums": "⚙️ Змінено мінімальні залишки"
};

export function renderLogs() {
  const box = qs("#warehouseLogs");
  if (!box) return;

  const logs = AppState.logs?.list || [];

  if (logs.length === 0) {
    box.innerHTML = `<div class="muted">Журнал порожній</div>`;
    return;
  }

  box.innerHTML = `
    <table class="feed-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Подія</th>
          <th>Деталі</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(renderLogRow).join("")}
      </tbody>
    </table>
  `;
}

function renderLogRow(log) {
  const date = new Date(log.at).toLocaleString("uk-UA");

  let details = "";

  if (log.componentId) {
    const c = (AppState.feedComponents || []).find(x => x.id === log.componentId);
    details += c ? c.name : log.componentId;
  }

  if (typeof log.amount === "number") {
    details += ` — ${log.amount}`;
  }

  return `
    <tr>
      <td>${date}</td>
      <td>${LOG_LABELS[log.type] || log.type}</td>
      <td>${details || "—"}</td>
      <td>
        <button class="danger" data-log-delete="${log.id}">✖</button>
      </td>
    </tr>
  `;
}