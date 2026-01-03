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

/* =========================
   ⏱ SAFE DATE
   ========================= */
function getIso(entry) {
  if (typeof entry?.createdAt === "string") return entry.createdAt;
  if (typeof entry?.at === "string") return entry.at;
  if (typeof entry?.createdAt === "number") return new Date(entry.createdAt).toISOString();
  if (typeof entry?.at === "number") return new Date(entry.at).toISOString();
  return null;
}

function formatDate(entry) {
  const iso = getIso(entry);
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =========================
   HELPERS
   ========================= */
function getComponentNameById(id) {
  const c = (AppState.feedComponents || []).find(x => x.id === id);
  return c?.name || id || "—";
}

function humanizeLog(entry) {
  const type = entry?.type || "unknown";
  const payload = entry?.payload || {};
  const componentId = payload.componentId ?? entry?.componentId;
  const amount = payload.amount ?? entry?.amount;

  switch (type) {
    case "feed:add":
      return `➕ Додано на склад: <b>${getComponentNameById(componentId)}</b> — ${Number(amount || 0)} кг`;

    case "feed:consume":
      return `➖ Списано зі складу: <b>${getComponentNameById(componentId)}</b> — ${Number(amount || 0)} кг`;

    case "feed:clear":
      return "🧹 Очищено склад корму";

    case "feed:mix":
      if (Array.isArray(payload.items) && payload.items.length) {
        return `
          🌾 <b>Змішано корм</b>:
          <ul style="margin:6px 0 0 18px">
            ${payload.items.map(i =>
              `<li>${getComponentNameById(i.componentId)} — ${Number(i.amount || 0)} кг</li>`
            ).join("")}
          </ul>
        `;
      }
      return "🌾 Змішано корм";

    case "trays:add":
      return `🧺 Додано порожніх лотків: <b>${Number(amount || 0)}</b> шт`;

    case "trays:reserve":
      return `🟡 Зарезервовано лотків: <b>+${Number(amount || 0)}</b> шт`;

    case "trays:release":
      return `↩ Знято резерв: <b>-${Number(amount || 0)}</b> шт`;

    case "warehouse:set-minimums":
      return "⚙️ Оновлено мінімальні залишки складу";
  }

  // ✅ ГАРАНТОВАНИЙ FALLBACK
  if (typeof entry?.message === "string" && entry.message.trim()) {
    return entry.message.trim();
  }

  return `🧾 ${type}`;
}

function badgeClass(type) {
  if (String(type).startsWith("feed:")) return "badge feed";
  if (String(type).startsWith("trays:")) return "badge trays";
  if (String(type).startsWith("warehouse:")) return "badge warehouse";
  return "badge";
}

/* =========================
   RENDER
   ========================= */
export function renderLogs() {
  const box = qs("#warehouseLogs");
  if (!box) return;

  const logs = Array.isArray(AppState.logs?.list) ? AppState.logs.list : [];
  const selected = AppState.ui?.logsFilter || "all";
  const filter = FILTERS.find(f => f.id === selected) || FILTERS[0];

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

  if (!filtered.length) {
    box.innerHTML = `${filtersHtml}<div class="muted" style="margin-top:8px">Немає записів</div>`;
    return;
  }

  box.innerHTML = `
    ${filtersHtml}
    <div class="logs-list">
      ${filtered.slice(0, 200).map(l => `
        <div class="log-item">
          <div class="log-head">
            <span class="${badgeClass(l.type)}">${l.type}</span>
            <span class="log-time">${formatDate(l)}</span>
            <button class="log-del" data-log-delete="${l.id}" title="Видалити">🗑</button>
          </div>
          <div class="log-msg">${humanizeLog(l)}</div>
        </div>
      `).join("")}
    </div>
  `;
}