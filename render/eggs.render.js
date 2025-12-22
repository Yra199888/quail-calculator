/**
 * 🥚 eggs.render.js
 * ---------------------------------------
 * Render обліку яєць
 * ❌ без логіки
 * ❌ без localStorage
 */

import { AppState } from "../state/AppState.js";

export function renderEggs() {
  const box = document.getElementById("eggs-report");
  if (!box) return;

  const records = AppState.eggs.records || {};
  const dates = Object.keys(records).sort().reverse();

  if (dates.length === 0) {
    box.innerHTML = "<i>Записів по яйцях ще немає</i>";
    return;
  }

  box.innerHTML = dates.map(date => {
    const e = records[date];

    return `
      <div class="egg-entry">
        <b>${date}</b><br>
        Всього: <b>${e.good}</b><br>
        Брак: ${e.bad}<br>
        Для дому: ${e.home}
      </div>
    `;
  }).join("");
}