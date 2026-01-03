/**
 * logs.render.js
 * ---------------------------------------
 * ✅ ТІЛЬКИ UI
 * - показує журнал складу
 * - фільтри
 * - видалення помилкових записів
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

const FILTERS = [
  { id: "all",  label: "Всі",        test: () => true },
  { id: "feed", label: "Корм",       test: (t) => String(t || "").startsWith("feed:") },
  { id: "trays", label: "Лотки",     test: (t) => String(t || "").startsWith("trays:") },
  { id: "warehouse", label: "Склад", test: (t) => String(t || "").startsWith("warehouse:") },
];

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

function getComponentNameById(id) {
  const list = AppState.feedComponents || [];
  const c = list.find(x => x?.id === id);
  return c?.name || id || "—";
}

function humanizeLog(entry) {
  const type = entry?.type || "unknown";

  // корм
  if (type === "feed:add") {
    const name = getComponentNameById(entry.componentId);
    const amount = Number(entry.amount || 0);
    return `➕ Додано на склад: <b>${name}</b> — ${amount} кг`;
  }

  if (type === "feed:consume") {
    const name = getComponentNameById(entry.componentId);
    const amount = Number(entry.amount || 0);
    return `➖ Списано зі складу: <b>${name}</b> — ${amount} кг`;
  }

  if (type === "feed:clear") {
    return `🧹 Очищено склад кормів`;
  }

  // лотки
  if (type === "trays:add") {
    const amount = Number(entry.amount || 0);
    return `🧺 Додано порожніх лотків: <b>${amount}</b> шт`;
  }

  if (type === "trays:reserve") {
    const amount = Number(entry.amount || 0);
    return `🟡 Резерв лотків: <b>+${amount}</b> шт`;
  }

  if (type === "trays:release") {
    const amount = Number(entry.amount || 0);
    return `↩ Знято резерв: <b>-${amount}</b> шт`;
  }

  // мінімальні залишки
  if (type === "warehouse:set-minimums") {
    return `⚙️ Оновлено мінімальні залишки складу`;
  }

  // невідомий тип — показуємо безпечно
  return `🧾 ${type}`;
}

function typeToBadge(type) {
  const t = String(type || "");
  if (t.startsWith("feed:")) return "badge feed";
  if (t.startsWith("trays:")) return "badge trays";
  if (t.startsWith("warehouse:")) return "badge warehouse";
  return "badge";
}

export function renderLogs() {
  const box = qs("#warehouseLogs");
  if (!box) return;

  // захист структури (тільки читання/рендер)
  const logs = Array.isArray(AppState.logs?.list) ? AppState.logs.list : [];
  const selected = AppState.ui?.logsFilter || "all";

  const currentFilter = FILTERS.find(f => f.id === selected) ? selected : "all";
  const filter = FILTERS.find(f => f.id === currentFilter) || FILTERS[0];

  const filtered = logs.filter(l => filter.test(l?.type));

  // UI фільтрів
  const filtersHtml = `
    <div class="logs-toolbar">
      ${FILTERS.map(f => `
        <button
          class="logs-filter ${f.id === currentFilter ? "active" : ""}"
          data-log-filter="${f.id}"
          type="button"
        >${f.label}</button>
      `).join("")}
    </div>
  `;

  if (filtered.length === 0) {
    box.innerHTML = `
      ${filtersHtml}
      <div class="muted" style="margin-top:8px">Немає записів</div>
    `;
    return;
  }

  // записи
  const listHtml = `
    <div class="logs-list">
      ${filtered.slice(0, 200).map(l => {
        const at = formatDateTime(l.at);
        const msg = humanizeLog(l);
        const badgeClass = typeToBadge(l.type);
        return `
          <div class="log-item">
            <div class="log-head">
              <span class="${badgeClass}">${String(l.type || "log")}</span>
              <span class="log-time">${at}</span>

              <button
                class="log-del"
                title="Видалити запис"
                data-log-delete="${l.id}"
                type="button"
              >🗑</button>
            </div>
            <div class="log-msg">${msg}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  box.innerHTML = `${filtersHtml}${listHtml}`;
}