/**
 * feed.render.js
 * ---------------------------------------
 * Render-шар калькулятора корму.
 * Відповідає ТІЛЬКИ за відображення:
 *  - компонентів
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
// 🧾 ТАБЛИЦЯ КОМПОНЕНТІВ (УСІ)
// =======================================
function renderFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  const components = AppState.feedComponents || [];

  tbody.innerHTML = components
    .map(c => {
      const qty =
        typeof AppState.feedCalculator.qtyById?.[c.id] === "number"
          ? AppState.feedCalculator.qtyById[c.id]
          : Number(c.kg ?? 0);

      const price =
        typeof AppState.feedCalculator.priceById?.[c.id] === "number"
          ? AppState.feedCalculator.priceById[c.id]
          : Number(c.price ?? 0);

      const sum = qty * price;
      const enabled = c.enabled !== false;

      return `
        <tr class="${enabled ? "" : "disabled"}">
          <td>
            <input
              type="checkbox"
              class="feed-enable"
              data-id="${c.id}"
              ${enabled ? "checked" : ""}
            />
            ${c.name}
          </td>

          <td>
            <input
              class="qty"
              data-id="${c.id}"
              type="number"
              min="0"
              step="0.01"
              value="${qty}"
              ${enabled ? "" : "disabled"}
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
              ${enabled ? "" : "disabled"}
            >
          </td>

          <td>${enabled ? sum.toFixed(2) : "—"}</td>
        </tr>
      `;
    })
    .join("");
}

// =======================================
// 📊 ПІДСУМКИ (ТІЛЬКИ ENABLED)
// =======================================
function renderFeedTotals() {
  const totalEl = document.getElementById("feedTotal");
  const perKgEl = document.getElementById("feedPerKg");
  const volumeTotalEl = document.getElementById("feedVolumeTotal");

  if (!totalEl || !perKgEl || !volumeTotalEl) return;

  const components = (AppState.feedComponents || []).filter(
    c => c.enabled !== false
  );

  let totalKg = 0;
  let totalCost = 0;

  components.forEach(c => {
    const qty =
      typeof AppState.feedCalculator.qtyById?.[c.id] === "number"
        ? AppState.feedCalculator.qtyById[c.id]
        : Number(c.kg ?? 0);

    const price =
      typeof AppState.feedCalculator.priceById?.[c.id] === "number"
        ? AppState.feedCalculator.priceById[c.id]
        : Number(c.price ?? 0);

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