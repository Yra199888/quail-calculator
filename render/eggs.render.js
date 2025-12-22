/**
 * render.eggs.js
 * ---------------------------------------
 * Render-шар обліку яєць.
 * Відповідає ТІЛЬКИ за відображення
 * даних з AppState у DOM.
 */

import { AppState } from "../state/AppState.js";

/**
 * Основний render списку яєць
 */
export function renderEggsList() {
  const container = document.getElementById("eggsList");
  if (!container) return;

  const records = AppState.eggs.records || {};
  const dates = Object.keys(records).sort().reverse();

  if (dates.length === 0) {
    container.innerHTML = "<i>Записів по яйцях немає</i>";
    return;
  }

  container.innerHTML = dates
    .map(date => renderEggRow(date, records[date]))
    .join("");
}

/**
 * Render одного дня
 */
function renderEggRow(date, data) {
  return `
    <div class="egg-entry">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <b>${date}</b>

        <div>
          <button onclick="eggsForm.startEdit('${date}', ${JSON.stringify(data)})">✏️</button>
          <button onclick="deleteEgg('${date}')">🗑️</button>
        </div>
      </div>

      <div style="margin-top:6px;">
        Всього: <b>${data.good}</b><br>
        Брак: ${data.bad}<br>
        Для дому: ${data.home}<br>
        Комерційні: ${data.commercial ?? 0}
      </div>

      <div style="margin-top:6px;font-size:14px;opacity:.85;">
        Перенос: ${data.carryIn ?? 0} → Разом: ${data.sum ?? 0}<br>
        Лотки: <b>${data.trays ?? 0}</b> | Залишок: ${data.remainder ?? 0}
      </div>
    </div>
  `;
}