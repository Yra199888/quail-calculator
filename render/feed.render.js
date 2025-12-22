/**
 * feed.render.js
 * ---------------------------------------
 * Render-шар калькулятора корму.
 * Відображає активні компоненти,
 * їх кількість, ціну та підсумки.
 */

import { AppState } from "../state/AppState.js";

/**
 * 🔹 ГОЛОВНИЙ render (викликається з app.js)
 */
export function renderFeed() {
  renderFeedTable();
  renderFeedTotals();
  renderFeedVolume();
}

/**
 * Таблиця компонентів корму
 */
function renderFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  const components = getActiveFeedComponents();

  tbody.innerHTML = components
    .map((c, i) => {
      const qty = AppState.feedCalculator.qty[i] ?? c.defaultQty ?? 0;
      const price = AppState.feedCalculator.price[i] ?? 0;
      const sum = Number(qty) * Number(price);

      return `
        <tr>
          <td>${c.name}</td>

          <td>
            <input
              class="qty"
              data-index="${i}"
              type="number"
              value="${qty}"
            >
          </td>

          <td>
            <input
              class="price"
              data-index="${i}"
              type="number"
              value="${price}"
            >
          </td>

          <td>${sum.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Підсумки калькулятора
 */
function renderFeedTotals() {
  const totalEl = document.getElementById("feedTotal");
  const perKgEl = document.getElementById("feedPerKg");
  const volumeTotalEl = document.getElementById("feedVolumeTotal");

  if (!totalEl || !perKgEl || !volumeTotalEl) return;

  const components = getActiveFeedComponents();

  let totalCost = 0;
  let totalKg = 0;

  components.forEach((_, i) => {
    const qty = Number(AppState.feedCalculator.qty[i] || 0);
    const price = Number(AppState.feedCalculator.price[i] || 0);

    totalKg += qty;
    totalCost += qty * price;
  });

  const perKg = totalKg > 0 ? totalCost / totalKg : 0;
  const volume = Number(AppState.feedCalculator.volume || 0);

  totalEl.textContent = totalCost.toFixed(2);
  perKgEl.textContent = perKg.toFixed(2);
  volumeTotalEl.textContent = (perKg * volume).toFixed(2);
}

/**
 * Обʼєм корму
 */
function renderFeedVolume() {
  const volInput = document.getElementById("feedVolume");
  if (!volInput) return;

  volInput.value = AppState.feedCalculator.volume ?? 25;
}

/**
 * Активні компоненти корму
 */
function getActiveFeedComponents() {
  return (AppState.feedComponents || []).filter(c => c.enabled);
}