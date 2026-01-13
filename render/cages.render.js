/**
 * cages.render.js
 * ---------------------------------------
 * Рендер UI для вкладки "Клітки"
 * КРОК 1 + КРОК 2
 */

import { AppState } from "../state/AppState.js";
import { qs, qsa } from "../utils/dom.js";

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

function createNewCage() {
  return {
    id: `cage_${Date.now().toString(36)}`,
    name: "Нова клітка",
    tiers: [1, 2, 3, 4].map(i => ({
      index: i,
      quails: 0,
      males: 0,
      females: 0
    }))
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
  const selectedId =
    AppState.ui.cages.selectedId || cages[0]?.id || null;

  /* =========================
     СПИСОК КЛІТОК + КНОПКА
  ========================= */
  listBox.innerHTML = `
    <div class="cages-toolbar">
      <button class="primary" id="addCageBtn">➕ Додати клітку</button>
    </div>

    ${
      !cages.length
        ? `<div class="muted">Поки що немає кліток.</div>`
        : `<div class="cages-grid">
            ${cages
              .map(c => {
                const totals = sumCage(c);
                const active = c.id === selectedId ? "active" : "";
                return `
                  <button class="cage-card ${active}" data-cage-open="${c.id}">
                    <div class="cage-card__title">${c.name}</div>
                    <div class="cage-card__meta">
                      <span>Ярусів: <b>${c.tiers.length}</b></span>
                      <span>Перепілок: <b>${totals.quails}</b></span>
                    </div>
                    <div class="cage-card__meta">
                      <span>Когутів: <b>${totals.males}</b></span>
                      <span>Курок: <b>${totals.females}</b></span>
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>`
    }
  `;

  /* =========================
     КНОПКА ДОДАВАННЯ
  ========================= */
  const addBtn = qs("#addCageBtn");
  addBtn.onclick = () => {
    const cage = createNewCage();
    cages.push(cage);
    AppState.ui.cages.selectedId = cage.id;
    renderCages();
  };

  qsa("[data-cage-open]").forEach(btn => {
    btn.onclick = () => {
      AppState.ui.cages.selectedId = btn.dataset.cageOpen;
      renderCages();
    };
  });

  /* =========================
     ДЕТАЛІ КЛІТКИ
  ========================= */
  const selected = cages.find(c => c.id === selectedId);
  if (!selected || !detailsPanel) {
    detailsPanel.style.display = "none";
    return;
  }

  detailsPanel.style.display = "block";
  detailsTitle.textContent = `🐦 ${selected.name}`;

  detailsBox.innerHTML = `
    <div class="cage-actions">
      <input class="cage-name-input" value="${selected.name}" data-cage-name />
      <button class="danger" data-cage-delete>🗑 Видалити клітку</button>
    </div>

    <div class="tiers-grid">
      ${selected.tiers
        .map(t => {
          const check = validateTier(t);
          return `
            <div class="tier-card tier-${check.status}">
              <div class="tier-title">Ярус ${t.index}</div>

              ${["quails", "males", "females"]
                .map(
                  f => `
                  <div class="tier-row">
                    <label>${f === "quails" ? "Перепілок" : f === "males" ? "Когутів" : "Курок"}</label>
                    <input type="number" min="0" value="${t[f]}"
                      data-tier="${t.index}" data-field="${f}">
                  </div>`
                )
                .join("")}

              <div class="tier-status tier-status-${check.status}">
                ${check.text}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  /* =========================
     ОБРОБНИКИ
  ========================= */
  qs("[data-cage-name]").oninput = e => {
    selected.name = e.target.value;
    renderCages();
  };

  qs("[data-cage-delete]").onclick = () => {
    AppState.cages.list = cages.filter(c => c.id !== selected.id);
    AppState.ui.cages.selectedId = null;
    renderCages();
  };

  qsa("[data-tier]").forEach(inp => {
    inp.oninput = () => {
      const tier = selected.tiers.find(t => t.index == inp.dataset.tier);
      tier[inp.dataset.field] = Number(inp.value || 0);
      renderCages();
    };
  });
}