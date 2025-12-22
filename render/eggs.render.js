/**
 * 🥚 eggs.render.js
 * ---------------------------------------
 * Render обліку яєць
 *
 * ❌ без бізнес-логіки
 * ❌ без localStorage / Firebase
 * ❌ без мутації AppState
 *
 * ✅ ТІЛЬКИ відображення + локальний UI-тогл в window
 */

import { AppState } from "../state/AppState.js";

const LAST_N_DAYS = 7;
const LAST_N_VISIBLE = 7;

export function renderEggs() {
  const box = document.getElementById("eggs-report");
  if (!box) return;

  const records = AppState.eggs?.records || {};
  const dates = Object.keys(records).sort().reverse();

  if (dates.length === 0) {
    box.innerHTML = "<i>Записів по яйцях ще немає</i>";
    return;
  }

  // ===============================
  // 📊 ПІДСУМОК ЗА 7 ДНІВ
  // ===============================
  const summaryHtml = calcLastNDaysSummary(records, LAST_N_DAYS);

  // ===============================
  // 🧾 СПИСОК: нові vs старі
  // ===============================
  const recentDates = dates.slice(0, LAST_N_VISIBLE);
  const oldDates = dates.slice(LAST_N_VISIBLE);

  const showOld = Boolean(window.__uiEggsShowOld);

  const recentHtml = recentDates.map((date) => renderEggEntry(date, records[date])).join("");

  const oldHtml =
    oldDates.length === 0
      ? ""
      : `
        <div class="egg-old-wrap" style="${showOld ? "" : "display:none;"}">
          ${oldDates.map((date) => renderEggEntry(date, records[date])).join("")}
        </div>
      `;

  const toggleBtnHtml =
    oldDates.length === 0
      ? ""
      : `
        <div class="egg-toggle-wrap">
          <button type="button" class="egg-toggle-btn" id="eggsToggleOldBtn">
            ${showOld ? "🔼 Сховати старі записи" : "🔽 Показати старі записи"} (${oldDates.length})
          </button>
        </div>
      `;

  box.innerHTML = `
    ${summaryHtml}
    ${recentHtml}
    ${toggleBtnHtml}
    ${oldHtml}
  `;

  // ===============================
  // 🔘 Подія кнопки (після render)
  // ===============================
  const btn = document.getElementById("eggsToggleOldBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.__uiEggsShowOld = !window.__uiEggsShowOld;
      renderEggs(); // перерендер тільки цієї секції
    });
  }
}

// ---------------------------------------
// 🧾 Один запис
// ---------------------------------------
function renderEggEntry(date, e = {}) {
  const good = Number(e.good || 0);
  const bad = Number(e.bad || 0);
  const home = Number(e.home || 0);

  return `
    <div class="egg-entry">
      <b>${date}</b><br>
      Всього: <b>${good}</b><br>
      Брак: ${bad}<br>
      Для дому: ${home}
    </div>
  `;
}

/**
 * 📊 Підсумок за останні N днів
 * ❗ тільки читання records
 */
function calcLastNDaysSummary(records, nDays) {
  const today = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date(today);
  to.setHours(23, 59, 59, 999);

  from.setDate(from.getDate() - (nDays - 1)); // включно N днів

  let good = 0;
  let bad = 0;
  let home = 0;

  Object.entries(records).forEach(([date, e]) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return;

    if (d >= from && d <= to) {
      good += Number(e?.good || 0);
      bad += Number(e?.bad || 0);
      home += Number(e?.home || 0);
    }
  });

  return `
    <div class="egg-summary">
      <b>📊 Підсумок за ${nDays} днів</b><br>
      🥚 Всього: <b>${good}</b><br>
      ❌ Брак: ${bad}<br>
      🏠 Для дому: ${home}
    </div>
    <hr>
  `;
}