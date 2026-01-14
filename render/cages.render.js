/**
 * cages.render.js
 * ---------------------------------------
 * Рендер UI для вкладки "Клітки"
 * КРОК 1–5
 * НОРМА: 1 когут = 3 курки
 */

import { AppState } from "../state/AppState.js";
import { qs, qsa } from "../utils/dom.js";

/* =========================
   NORMS
========================= */
const NORMS = {
  MAX_QUAILS_PER_TIER: 40,
  IDEAL_FEMALES_PER_MALE: 3
};

/* =========================
   HELPERS
========================= */
function sumCage(cage) {
  return cage.tiers.reduce(
    (acc, t) => {
      acc.quails += +t.quails;
      acc.males += +t.males;
      acc.females += +t.females;
      return acc;
    },
    { quails: 0, males: 0, females: 0 }
  );
}

/* =========================
   VALIDATION
========================= */
function validateTier(t) {
  const q = +t.quails, m = +t.males, f = +t.females;

  if (q > NORMS.MAX_QUAILS_PER_TIER)
    return { status: "error", text: "🔴 Перенаселення" };

  if (m + f > q)
    return { status: "error", text: "🔴 Логічна помилка кількості" };

  if (m === 0 && f > 0)
    return { status: "warning", text: "🟡 Немає когутів" };

  if (m > 0 && f / m > NORMS.IDEAL_FEMALES_PER_MALE)
    return { status: "warning", text: "🟡 Забагато курок на когутів" };

  return { status: "ok", text: "🟢 Ярус у нормі" };
}

/* =========================
   🧠 RECOMMENDATIONS (КРОК 5)
========================= */
function getTierRecommendation(t) {
  const m = +t.males;
  const f = +t.females;

  if (m === 0 && f > 0) {
    return "➕ Додай мінімум 1 когутa";
  }

  if (m > 0) {
    const idealFemales = m * NORMS.IDEAL_FEMALES_PER_MALE;

    if (f > idealFemales) {
      return `➖ Забери ${f - idealFemales} курок`;
    }

    if (f < idealFemales) {
      return `➕ Можна додати ${idealFemales - f} курки`;
    }
  }

  return "✅ Нічого робити не потрібно";
}

/* =========================
   CREATE CAGE
========================= */
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

  AppState.cages ||= { list: [] };
  AppState.ui ||= { cages: {} };

  const cages = AppState.cages.list;
  const selectedId = AppState.ui.cages.selectedId || cages[0]?.id;

  listBox.innerHTML = `
    <div class="cages-toolbar">
      <button class="primary" id="addCageBtn">➕ Додати клітку</button>
    </div>
    <div class="cages-grid">
      ${cages.map(c => {
        const t = sumCage(c);
        return `
          <button class="cage-card ${c.id === selectedId ? "active" : ""}"
            data-cage-open="${c.id}">
            <div class="cage-card__title">${c.name}</div>
            <div>🐦 ${t.quails} | 🐓 ${t.males} | 🐔 ${t.females}</div>
          </button>
        `;
      }).join("")}
    </div>
  `;

  qs("#addCageBtn").onclick = () => {
    const c = createNewCage();
    cages.push(c);
    AppState.ui.cages.selectedId = c.id;
    renderCages();
  };

  qsa("[data-cage-open]").forEach(b => {
    b.onclick = () => {
      AppState.ui.cages.selectedId = b.dataset.cageOpen;
      renderCages();
    };
  });

  const cage = cages.find(c => c.id === selectedId);
  if (!cage) return;

  detailsPanel.style.display = "block";
  detailsTitle.textContent = cage.name;

  detailsBox.innerHTML = `
    <div class="tiers-grid">
      ${cage.tiers.map(t => {
        const check = validateTier(t);
        const rec = getTierRecommendation(t);

        return `
          <div class="tier-card tier-${check.status}">
            <div class="tier-title">Ярус ${t.index}</div>

            ${["quails","males","females"].map(f => `
              <div class="tier-row">
                <label>${f}</label>
                <input type="number" min="0" value="${t[f]}"
                  data-tier="${t.index}" data-field="${f}">
              </div>
            `).join("")}

            <div class="tier-status">${check.text}</div>
            <div class="tier-recommendation">💡 ${rec}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  qsa("[data-tier]").forEach(inp => {
    inp.oninput = () => {
      const tier = cage.tiers.find(t => t.index == inp.dataset.tier);
      tier[inp.dataset.field] = +inp.value || 0;
      renderCages();
    };
  });
}