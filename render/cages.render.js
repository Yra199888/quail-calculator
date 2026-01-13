/**
 * cages.render.js
 * ---------------------------------------
 * Рендер UI для вкладки "Клітки"
 * КРОК 1:
 *  - перевірка ярусів
 *  - статуси (ok / warning / error)
 *  - повідомлення під кожним ярусом
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

/* =========================
   HELPERS
========================= */
function sumCage(cage) {
  const tiers = Array.isArray(cage?.tiers) ? cage.tiers : [];
  return tiers.reduce(
    (acc, t) => {
      acc.quails += Number(t.quails || 0);
      acc.males += Number(t.males || 0);
      acc.females += Number(t.females || 0);
      return acc;
    },
    { quails: 0, males: 0, females: 0 }
  );
}

function validateTier(tier) {
  const quails = Number(tier.quails || 0);
  const males = Number(tier.males || 0);
  const females = Number(tier.females || 0);

  if (males + females > quails) {
    return {
      status: "error",
      text: "🔴 Кількість когутів і курок перевищує загальну кількість перепілок"
    };
  }

  if (males > females) {
    return {
      status: "warning",
      text: "🟡 Когутів більше, ніж курок"
    };
  }

  if (males === 0 && females > 0) {
    return {
      status: "warning",
      text: "🟡 В ярусі немає когутів"
    };
  }

  return {
    status: "ok",
    text: "🟢 Співвідношення нормальне"
  };
}

/* =========================
   MAIN RENDER
========================= */
export function renderCages() {
  const listBox = qs("#cagesList");
  const detailsPanel = qs("#cageDetailsPanel");
  const detailsTitle = qs("#cageDetailsTitle");
  const detailsBox = qs("#cageDetails");

  if (!listBox) return;

  AppState.cages ||= { list: [] };
  AppState.cages.list ||= [];
  AppState.ui ||= {};
  AppState.ui.cages ||= {};

  const cages = AppState.cages.list;
  const selectedId = AppState.ui.cages.selectedId || (cages[0]?.id ?? null);

  /* =========================
     СПИСОК КЛІТОК
  ========================= */
  if (!cages.length) {
    listBox.innerHTML = `
      <div class="muted">
        Поки що немає кліток. Натисни “➕ Додати клітку”.
      </div>
    `;
  } else {
    listBox.innerHTML = `
      <div class="cages-grid">
        ${cages.map(c => {
          const totals = sumCage(c);
          const active = c.id === selectedId ? "active" : "";
          return `
            <button class="cage-card ${active}" type="button" data-cage-open="${c.id}">
              <div class="cage-card__title">${c.name || "Клітка"}</div>
              <div class="cage-card__meta">
                <span>Ярусів: <b>${c.tiers?.length || 0}</b></span>
                <span>Перепілок: <b>${totals.quails}</b></span>
              </div>
              <div class="cage-card__meta">
                <span>Когутів: <b>${totals.males}</b></span>
                <span>Курок: <b>${totals.females}</b></span>
              </div>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  /* =========================
     ДЕТАЛІ КЛІТКИ
  ========================= */
  const selected = cages.find(c => c.id === selectedId);

  if (!detailsPanel || !detailsTitle || !detailsBox) return;

  if (!selected) {
    detailsPanel.style.display = "none";
    return;
  }

  detailsPanel.style.display = "block";
  detailsTitle.textContent = `🐦 ${selected.name || "Клітка"}`;

  const tiers = Array.isArray(selected.tiers) ? selected.tiers : [];

  detailsBox.innerHTML = `
    <div class="cage-actions">
      <input
        class="cage-name-input"
        type="text"
        value="${(selected.name || "").replaceAll('"', "&quot;")}"
        data-cage-name="${selected.id}"
      />
      <button class="danger" type="button" data-cage-delete="${selected.id}">
        🗑 Видалити клітку
      </button>
    </div>

    <div class="tiers-grid">
      ${tiers.map(t => {
        const check = validateTier(t);
        return `
          <div class="tier-card tier-${check.status}">
            <div class="tier-title">Ярус ${t.index}</div>

            <div class="tier-row">
              <label>Перепілок</label>
              <input type="number" min="0" step="1"
                value="${Number(t.quails || 0)}"
                data-tier-field="quails"
                data-cage-id="${selected.id}"
                data-tier-index="${t.index}"
              />
            </div>

            <div class="tier-row">
              <label>Когутів</label>
              <input type="number" min="0" step="1"
                value="${Number(t.males || 0)}"
                data-tier-field="males"
                data-cage-id="${selected.id}"
                data-tier-index="${t.index}"
              />
            </div>

            <div class="tier-row">
              <label>Курок</label>
              <input type="number" min="0" step="1"
                value="${Number(t.females || 0)}"
                data-tier-field="females"
                data-cage-id="${selected.id}"
                data-tier-index="${t.index}"
              />
            </div>

            <div class="tier-status tier-status-${check.status}">
              ${check.text}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}