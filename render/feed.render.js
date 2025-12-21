// /src/render/feed.render.js
import { calculateFeed } from "../services/feed.service.js";
import { $ } from "../utils/dom.js";

export function renderFeedTotals(AppState) {
  const res = calculateFeed(AppState);

  if ($("feedTotal")) $("feedTotal").textContent = res.totalCost.toFixed(2);
  if ($("feedPerKg")) $("feedPerKg").textContent = res.perKg.toFixed(2);
  if ($("feedVolumeTotal")) $("feedVolumeTotal").textContent = res.volumeTotal.toFixed(2);

  // суми по рядках (якщо в таблиці є id="sum_0", "sum_1"...)
  res.rows.forEach((r, i) => {
    const cell = $("sum_" + i);
    if (cell) cell.textContent = r.sum.toFixed(2);
  });
}