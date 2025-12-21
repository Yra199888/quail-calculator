// /src/render/feed.render.js
import { qs } from "../utils/dom.js";
import { getActiveFeedComponents } from "../services/feed.service.js";

export function renderFeedTable(AppState) {
  const tbody = qs("#feedTable");
  if (!tbody) return;

  const components = getActiveFeedComponents(AppState);
  const qty = AppState.feedCalculator.qty || [];
  const price = AppState.feedCalculator.price || [];

  tbody.innerHTML = components.map((c, i) => `
    <tr>
      <td>${c.name}</td>

      <td>
        <input
          type="number"
          class="qty"
          data-i="${i}"
          value="${qty[i] ?? c.defaultQty ?? 0}"
        >
      </td>

      <td>
        <input
          type="number"
          class="price"
          data-i="${i}"
          value="${price[i] ?? 0}"
        >
      </td>

      <td id="sum_${i}">0</td>
    </tr>
  `).join("");
}

export function renderFeedTotals(AppState) {
  const totals = AppState.feedCalculator.totals;
  if (!totals) return;

  qs("#feedTotal").textContent = totals.totalCost.toFixed(2);
  qs("#feedPerKg").textContent = totals.perKg.toFixed(2);
  qs("#feedVolumeTotal").textContent =
    (totals.perKg * totals.volume).toFixed(2);
}