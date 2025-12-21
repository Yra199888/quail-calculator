// ui/warnings.js

import { $ } from "../utils/dom.js";

export function applyWarehouseWarnings(AppState, components) {
  const box = $("warehouseWarning");
  const list = $("warehouseWarningList");
  if (!box || !list) return;

  const mins = AppState.warehouse.minimums || {};
  const warnings = [];

  components.forEach(c => {
    const stock = Number(AppState.warehouse.feed[c.id] || 0);
    const min = Number(mins[c.id] || 0);
    if (min > 0 && stock < min) {
      warnings.push(`• ${c.name}: ${stock} кг (мін. ${min})`);
    }
  });

  if (warnings.length) {
    list.innerHTML = warnings.join("<br>");
    box.style.display = "block";
  } else {
    box.style.display = "none";
    list.innerHTML = "";
  }
}