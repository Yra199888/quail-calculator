/**
 * feed.render.js
 * ---------------------------------------
 * Render-шар калькулятора корму.
 * Відповідає ТІЛЬКИ за відображення:
 *  - активних компонентів
 *  - кількості
 *  - ціни
 *  - підсумків
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ localStorage
 * ❌ БЕЗ мутації AppState
 */

import { AppState } from "../state/AppState.js";

// =======================================
// 🔹 ГОЛОВНИЙ RENDER
// =======================================
export function renderFeed() {
  renderFeedTable();
  renderFeedTotals();
  renderFeedVolume();
}

// =======================================
// 🧾 ТАБЛИЦЯ КОМПОНЕНТІВ
// =======================================
function renderFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  const components = getActiveFeedComponents();

  tbody.innerHTML = components
    .map(c => {
      const qty =
        typeof AppState.feedCalculator.qtyById?.[c.id] === "number"
          ? AppState.feedCalculator.qtyById[c.id]
          : (c.defaultQty ?? 0);

      const price =
        typeof AppState.feedCalculator.priceById?.[c.id] === "number"
          ? AppState.feedCalculator.priceById[c.id]
          : 0;

      const sum = Number(qty) * Number(price);

      return `
        <tr>
          <td>${c.name}</td>

          <td>
            <input
              class="qty"
              data-id="${c.id}"
              type="number"
              min="0"
              step="0.1"
              value="${qty}"
            >
          </td>

          <td>
            <input
              class="price"
              data-id="${c.id}"
              type="number"
              min="0"
              step="0.01"
              value="${price}"
            >
          </td>

          <td>${sum.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

// =======================================
// 📊 ПІДСУМКИ КАЛЬКУЛЯТОРА
// =======================================
function renderFeedTotals() {
  const totalEl = document.getElementById("feedTotal");
  const perKgEl = document.getElementById("feedPerKg");
  const volumeTotalEl = document.getElementById("feedVolumeTotal");

  if (!totalEl || !perKgEl || !volumeTotalEl) return;

  const components = getActiveFeedComponents();

  let totalKg = 0;
  let totalCost = 0;

  components.forEach(c => {
    const qty = Number(AppState.feedCalculator.qtyById?.[c.id] || 0);
    const price = Number(AppState.feedCalculator.priceById?.[c.id] || 0);

    totalKg += qty;
    totalCost += qty * price;
  });

  const perKg = totalKg > 0 ? totalCost / totalKg : 0;
  const volume = Number(AppState.feedCalculator.volume || 0);

  totalEl.textContent = totalCost.toFixed(2);
  perKgEl.textContent = perKg.toFixed(2);
  volumeTotalEl.textContent = (perKg * volume).toFixed(2);
}

// =======================================
// ⚖️ ОБʼЄМ КОРМУ
// =======================================
function renderFeedVolume() {
  const volInput = document.getElementById("feedVolume");
  if (!volInput) return;

  volInput.value = AppState.feedCalculator.volume ?? 25;
}

// =======================================
// 🔎 АКТИВНІ КОМПОНЕНТИ
// =======================================
function getActiveFeedComponents() {
  return (AppState.feedComponents || []).filter(c => c.enabled);
}