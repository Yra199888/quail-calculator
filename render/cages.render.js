/**
 * cages.render.js
 * ---------------------------------------
 * ЧИСТИЙ рендер вкладки "Клітки"
 * Без бізнес-логіки
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";
import { evaluateTier, getTierRecommendation } from "../services/cages.service.js";

/* =========================
   HELPERS
========================= */

function sumCage(cage) {
  return cage.tiers.reduce(
    (acc, t) => {
      acc.quails += Number(t.quails || 0);
      acc.males += Number(t.males || 0);
      acc.females += Number(t.females || 0);
      return acc;
    },
    { quails: 0, males: 0, females: 0 }
  );
}

/* =========================
   MAIN RENDER
========================= */

export function renderCages() {
  const listBox = qs("#cagesList");
  const detailsPanel = qs("#cageDetailsPanel");
  const detailsTitle = qs("#cageDetailsTitle");
  const detailsBox = qs("#cageDetails");

  AppState.cages ||= { list: [] };
  AppState.ui ||= { cages: {} };

  const cages = AppState.cages.list;
  const selectedId = AppState.ui.cages.selectedId || cages[0]?.id;

  /* ===== LEFT: CAGES LIST ===== */

  listBox.innerHTML = `
    <div class="cages-toolbar">
      <button class="primary" id="cage-add-btn">➕ Додати клітку</button>
    </div>

    <div class="cages-grid">
      ${cages.map(c => {
        const total = sumCage(c);
        const isActive = c.id === selectedId;

        return `
          <button
            class="cage-card ${isActive ? "active" : ""}"
            data-cage-open="${c.id}"
          >
            <div class="cage-card__title">${c.name}</div>
            <div class="cage-card__summary">
              🐦 ${total.quails}
              &nbsp;|&nbsp;
              🐓 ${total.males}
              &nbsp;|&nbsp;
              🐔 ${total.females}
            </div>
          </button>
        `;
      }).join("")}
    </div>
  `;

  /* ===== RIGHT: DETAILS ===== */

  const cage = cages.find(c => c.id === selectedId);
  if (!cage) {
    detailsPanel.style.display = "none";
    return;
  }

  detailsPanel.style.display = "block";
  detailsTitle.textContent = cage.name;

  detailsBox.innerHTML = `
    <div class="tiers-grid">
      ${cage.tiers.map(t => {
        const result = evaluateTier(t);
        const recommendation = getTierRecommendation(t);

        return `
          <div class="tier-card tier-${result.level}">
            <div class="tier-title">Ярус ${t.index}</div>

            ${["quails", "males", "females"].map(field => `
              <div class="tier-row">
                <label>${field}</label>
                <input
                  type="number"
                  min="0"
                  value="${t[field] ?? 0}"
                  data-tier-field="${field}"
                  data-cage-id="${cage.id}"
                  data-tier-index="${t.index}"
                />
              </div>
            `).join("")}

            <div class="tier-status">
              ${
                result.issues.length
                  ? result.issues.map(i => `
                      <div class="tier-issue tier-issue-${i.level}">
                        ${i.level === "error" ? "🔴" : "🟡"} ${i.message}
                        ${i.details ? `<span class="muted">(${i.details})</span>` : ""}
                      </div>
                    `).join("")
                  : `<div class="tier-ok">🟢 Ярус у нормі</div>`
              }
            </div>

            <div class="tier-recommendation">
              💡 ${recommendation}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}