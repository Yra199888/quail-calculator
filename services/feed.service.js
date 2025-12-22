/**
 * feed.service.js
 * ---------------------------------------
 * Бізнес-логіка кормів:
 *  - компоненти
 *  - калькулятор
 *  - рецепти
 *  - перевірка складу
 *
 * ❌ БЕЗ DOM
 */

import { AppState } from "../state/AppState.js";

// ============================
//  COMPONENTS
// ============================
export function getFeedComponents() {
  return AppState.feedComponents || [];
}

export function getActiveFeedComponents() {
  return getFeedComponents().filter(c => c.enabled);
}

// ============================
//  CALCULATOR CORE
// ============================
export function calculateFeed() {
  const active = getActiveFeedComponents();

  const qty = AppState.feedCalculator.qty || [];
  const price = AppState.feedCalculator.price || [];
  const volume = Number(AppState.feedCalculator.volume || 0);

  let totalKg = 0;
  let totalCost = 0;

  active.forEach((_, i) => {
    const q = Number(qty[i] || 0);
    const p = Number(price[i] || 0);

    totalKg += q;
    totalCost += q * p;
  });

  const perKg = totalKg > 0 ? totalCost / totalKg : 0;

  AppState.feedCalculator.totals = {
    totalKg,
    totalCost,
    perKg,
    volume
  };
}

// ============================
//  RECIPES (LOGIC ONLY)
// ============================
export function snapshotFromCalculator() {
  const active = getActiveFeedComponents();
  const qty = AppState.feedCalculator.qty || [];

  const components = {};

  active.forEach((c, i) => {
    const q = Number(qty[i] || 0);
    if (q > 0) components[c.id] = q;
  });

  return {
    volume: Number(AppState.feedCalculator.volume || 0),
    components
  };
}

export function applyRecipeToCalculator(recipe) {
  const active = getActiveFeedComponents();

  AppState.feedCalculator.qty = [];
  AppState.feedCalculator.price = AppState.feedCalculator.price || [];

  active.forEach((c, i) => {
    AppState.feedCalculator.qty[i] =
      Number(recipe.components?.[c.id] || 0);
  });

  AppState.feedCalculator.volume =
    Number(recipe.volume || AppState.feedCalculator.volume || 25);
}

// ============================
//  WAREHOUSE CHECK
// ============================
export function canMakeFeed() {
  const active = getActiveFeedComponents();
  const qty = AppState.feedCalculator.qty || [];

  for (let i = 0; i < active.length; i++) {
    const c = active[i];
    const need = Number(qty[i] || 0);
    const stock = Number(AppState.warehouse.feed?.[c.id] || 0);

    if (need > stock) {
      return { ok: false, component: c };
    }
  }

  return { ok: true };
}

export function consumeFeedFromWarehouse() {
  const active = getActiveFeedComponents();
  const qty = AppState.feedCalculator.qty || [];

  active.forEach((c, i) => {
    const need = Number(qty[i] || 0);
    AppState.warehouse.feed[c.id] =
      Number(AppState.warehouse.feed[c.id] || 0) - need;
  });
}