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
  { id: "all", label: "Всі", test: () => true },
  { id: "feed", label: "Корм", test: t => String(t || "").startsWith("feed:") },
  { id: "trays", label: "Лотки", test: t => String(t || "").startsWith("trays:") },
  { id: "warehouse", label: "Склад", test: t => String(t || "").startsWith("warehouse:") },
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

/**
 * 🧠 Людський текст логу
 */
function humanizeLog(entry) {
  const type = entry?.type || "unknown";
  const p = entry?.payload || {};

  // =========================
  // 🌾 КОРМ
  // =========================
  if (type === "feed:add") {
    return `➕ Додано на склад: <b>${getComponentNameById(p.componentId)}</b> — ${Number(p.amount || 0)} кг`;
  }

  if (type === "feed:consume") {
    return `➖ Списано зі складу: <b>${getComponentNameById(p.componentId)}</b> — ${Number(p.amount || 0)} кг`;
  }

  if (type === "feed:mix") {
    const items = Array.isArray(p.items) ? p.items : [];
    if (!items.length) return "🌾 Змішано корм";

    return `
      🌾 <b>Змішано корм</b>:
      <ul class="log-mix-list">
        ${items.map(i => `
          <li>${getComponentNameById(i.componentId)} — ${i.amount} кг</li>
        `).join("")}
      </ul>
    `;
  }

  if (type === "feed:clear") {
    return "🧹 Очищено склад кормів";
  }

  // =========================
  // 🧺 ЛОТКИ
  // =========================
  if (type === "trays:add") {
    return `🧺 Додано порожніх лотків: <b>${Number(p.amount || 0)}</b> шт`;
  }

  if (type === "trays:reserve") {
    return `🟡 Зарезервовано лотків: <b>+${Number(p.amount || 0)}</b> шт`;
  }

  if (type === "trays:release") {
    return `↩ Знято резерв: <b>-${Number(p.amount || 0)}</b> шт`;
  }

  // =========================
  // ⚙️ СКЛАД
  // =========================
  if (type === "warehouse:set-minimums") {
    return "⚙️ Оновлено мінімальні залишки складу";
  }

  // fallback
  return entry?.message || `🧾 ${type}`;
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

  const logs = Array.isArray(AppState.logs?.list) ? AppState.logs.list : [];
  const selected = AppState.ui?.logsFilter || "all";

  const filter =
    FILTERS.find(f => f.id === selected) ||
    FILTERS[0];

  const filtered = logs.filter(l => filter.test(l?.type));

  const filtersHtml = `
    <div class="logs-toolbar">
      ${FILTERS.map(f => `
        <button
          class="logs-filter ${f.id === filter.id ? "active" : ""}"
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

  const listHtml = `
    <div class="logs-list">
      ${filtered.slice(0, 200).map(l => `
        <div class="log-item">
          <div class="log-head">
            <span class="${typeToBadge(l.type)}">${l.type}</span>
            <span class="log-time">${formatDateTime(l.createdAt || l.at)}</span>
            <button
              class="log-del"
              title="Видалити запис"
              data-log-delete="${l.id}"
              type="button"
            >🗑</button>
          </div>
          <div class="log-msg">${humanizeLog(l)}</div>
        </div>
      `).join("")}
    </div>
  `;

  box.innerHTML = `${filtersHtml}${listHtml}`;
}