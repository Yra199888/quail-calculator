/**
 * cages.service.js
 * ---------------------------------------
 * Бізнес-логіка кліток (БЕЗ DOM)
 * ЄДИНЕ джерело правил і перевірок
 */

import { AppState } from "../state/AppState.js";

/* =========================
   ІНІЦІАЛІЗАЦІЯ СТАНУ
========================= */

function ensureCages() {
  AppState.cages ||= {};
  AppState.cages.list ||= [];
}

/* =========================
   ПРАВИЛА ТА НОРМИ
========================= */

export const CAGE_RULES = {
  MAX_QUAILS_PER_TIER: 40,
  IDEAL_FEMALES_PER_MALE: 3
};

/* =========================
   ОТРИМАННЯ ДАНИХ
========================= */

export function getCages() {
  ensureCages();
  return AppState.cages.list;
}

/* =========================
   РОБОТА З КЛІТКАМИ
========================= */

export function createCage({ name = "Клітка", tiers = 4 } = {}) {
  ensureCages();

  const cageId = `cage_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const tierList = Array.from(
    { length: Math.max(1, Number(tiers) || 4) },
    (_, i) => ({
      id: `tier_${i + 1}`,
      index: i + 1,
      quails: 0,
      males: 0,
      females: 0
    })
  );

  const cage = {
    id: cageId,
    name: `${name} #${AppState.cages.list.length + 1}`,
    tiers: tierList,
    createdAt: new Date().toISOString()
  };

  AppState.cages.list.unshift(cage);
  return cage;
}

export function deleteCage(cageId) {
  ensureCages();
  AppState.cages.list = AppState.cages.list.filter(
    c => c.id !== cageId
  );
}

export function updateCageName(cageId, name) {
  ensureCages();
  const cage = AppState.cages.list.find(c => c.id === cageId);
  if (!cage) return;

  cage.name = String(name || "").trim() || cage.name;
}

/* =========================
   РОБОТА З ЯРУСАМИ
========================= */

export function updateTier(cageId, tierIndex, patch) {
  ensureCages();

  const cage = AppState.cages.list.find(c => c.id === cageId);
  if (!cage) return;

  const tier = cage.tiers?.find(
    t => t.index === Number(tierIndex)
  );
  if (!tier) return;

  const next = { ...patch };

  ["quails", "males", "females"].forEach(key => {
    if (key in next) {
      const value = Number(next[key]);
      next[key] = Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
    }
  });

  Object.assign(tier, next);
}

/* =========================
   ПЕРЕВІРКА ЯРУСУ
========================= */

export function evaluateTier(tier) {
  const issues = [];

  const quails = Number(tier.quails || 0);
  const males = Number(tier.males || 0);
  const females = Number(tier.females || 0);

  // Перенаселення
  if (quails > CAGE_RULES.MAX_QUAILS_PER_TIER) {
    issues.push({
      level: "error",
      type: "density",
      message: "Перенаселення",
      details: `${quails} / ${CAGE_RULES.MAX_QUAILS_PER_TIER}`
    });
  }

  // Логічна помилка кількості
  if (males + females > quails) {
    issues.push({
      level: "error",
      type: "logic",
      message: "Когутів і курок більше, ніж перепілок"
    });
  }

  // Немає когутів
  if (males === 0 && females > 0) {
    issues.push({
      level: "warning",
      type: "ratio",
      message: "Немає когутів"
    });
  }

  // Забагато курок на когута
  if (
    males > 0 &&
    females / males > CAGE_RULES.IDEAL_FEMALES_PER_MALE
  ) {
    issues.push({
      level: "warning",
      type: "ratio",
      message: "Забагато курок на одного когута"
    });
  }

  const level = issues.some(i => i.level === "error")
    ? "error"
    : issues.some(i => i.level === "warning")
    ? "warning"
    : "ok";

  return { level, issues };
}

/* =========================
   РЕКОМЕНДАЦІЇ ДЛЯ ЯРУСУ
========================= */

export function getTierRecommendation(tier) {
  const males = Number(tier.males || 0);
  const females = Number(tier.females || 0);

  if (males === 0 && females > 0) {
    return "➕ Додайте мінімум 1 когута";
  }

  if (males > 0) {
    const idealFemales =
      males * CAGE_RULES.IDEAL_FEMALES_PER_MALE;

    if (females > idealFemales) {
      return `➖ Заберіть ${females - idealFemales} курок`;
    }

    if (females < idealFemales) {
      return `➕ Можна додати ${idealFemales - females} курки`;
    }
  }

  return "✅ Нічого робити не потрібно";
}