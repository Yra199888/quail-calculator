/**
 * 🥚 eggs.render.js
 * ---------------------------------------
 * Render обліку яєць
 *
 * ❌ без бізнес-логіки
 * ❌ без localStorage / Firebase
 * ❌ без мутації AppState
 *
 * ✅ ТІЛЬКИ відображення
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

  // ===============================
  // 📊 ПІДСУМОК ЗА 7 ДНІВ
  // ===============================
  const summary = calcLast7DaysSummary(records);

  // ===============================
  // 🧾 СПИСОК ДНІВ
  // ===============================
  const listHtml = dates.map(date => {
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

  box.innerHTML = `
    ${summary}
    ${listHtml}
  `;
}

/**
 * 📊 Підсумок за останні 7 днів
 * ❗ тільки читання records
 */
function calcLast7DaysSummary(records) {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 6); // разом 7 днів

  let good = 0;
  let bad = 0;
  let home = 0;

  Object.entries(records).forEach(([date, e]) => {
    const d = new Date(date);
    if (isNaN(d)) return;

    if (d >= from && d <= today) {
      good += Number(e.good || 0);
      bad += Number(e.bad || 0);
      home += Number(e.home || 0);
    }
  });

  return `
    <div class="egg-summary">
      <b>📊 Підсумок за 7 днів</b><br>
      🥚 Всього: <b>${good}</b><br>
      ❌ Брак: ${bad}<br>
      🏠 Для дому: ${home}
    </div>
    <hr>
  `;
}