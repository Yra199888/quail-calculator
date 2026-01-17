/**
 * logs.render.js
 * ---------------------------------------
 * ✅ ТІЛЬКИ UI
 * Людський журнал складу (банківський стиль)
 * Без ламання існуючої логіки
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function getHumanTitle(entry) {
  if (entry.type === "feed:add") return "➕ Додавання";
  if (entry.type === "feed:consume") return "➖ Списання";
  if (entry.type === "feed:mix") return "🌾 Змішування корму";
  if (entry.type === "trays:add") return "➕ Лотки";
  if (entry.type === "trays:reserve") return "🟡 Резерв лотків";
  if (entry.type === "trays:release") return "↩ Зняття резерву";
  return "ℹ️ Подія";
}

function getHumanMessage(entry) {
  const payload = entry?.payload || {};
  const componentId = payload.componentId ?? entry?.componentId;
  const amount = payload.amount ?? entry?.amount;

  if (entry.type?.startsWith("feed:")) {
    if (entry.type === "feed:mix" && Array.isArray(payload.items)) {
      return payload.items
        .map(i => `${getComponentNameById(i.componentId)} — ${Number(i.amount || 0)} кг`)
        .join(", ");
    }
    return `${getComponentNameById(componentId)} — ${Number(amount || 0)} кг`;
  }

  if (entry.type?.startsWith("trays:")) {
    return `Лотки — ${Number(amount || 0)} шт`;
  }

  if (typeof entry.message === "string" && entry.message.trim()) {
    return entry.message.trim();
  }

  return "—";
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
    <div class="bank-log">
      ${filtered.slice(0, 200).map(l => `
        <div class="bank-log-item ${l.type?.includes("consume") ? "consume" : "add"}">
          <div class="bank-log-title">
            ${getHumanTitle(l)}
          </div>

          <div class="bank-log-message">
            ${getHumanMessage(l)}
          </div>

          <div class="bank-log-footer">
            <span class="bank-log-time">${formatDate(l)}</span>
            <button
              class="log-del"
              data-log-delete="${l.id}"
              title="Видалити"
            >🗑</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}