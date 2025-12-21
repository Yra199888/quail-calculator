// src/services/feedCalculatorService.js

export function computeFeedTotals(qty = [], price = []) {
  let totalCost = 0;
  let totalKg = 0;

  qty.forEach((q, i) => {
    const p = Number(price[i] || 0);
    const amount = Number(q || 0);

    totalKg += amount;
    totalCost += amount * p;
  });

  const perKg = totalKg > 0 ? totalCost / totalKg : 0;

  return {
    totalKg,
    totalCost,
    perKg
  };
}

// /src/services/feed.service.js

export function getActiveFeedComponents(AppState) {
  return (AppState.feedComponents || []).filter(c => c && c.enabled !== false);
}

/**
 * ✅ ЧИСТА функція: НЕ торкається DOM
 * Працює тільки з AppState і повертає розрахунки.
 */
export function calculateFeed(AppState) {
  const active = getActiveFeedComponents(AppState);

  const qty = Array.isArray(AppState.feedCalculator?.qty) ? AppState.feedCalculator.qty : [];
  const price = Array.isArray(AppState.feedCalculator?.price) ? AppState.feedCalculator.price : [];
  const volume = Number(AppState.feedCalculator?.volume ?? 25);

  let totalCost = 0;
  let totalKg = 0;

  const rows = active.map((c, i) => {
    const q = Number(qty[i] ?? c.defaultQty ?? 0) || 0;
    const p = Number(price[i] ?? 0) || 0;
    const sum = q * p;

    totalKg += q;
    totalCost += sum;

    return {
      id: c.id,
      name: c.name,
      qty: q,
      price: p,
      sum
    };
  });

  const perKg = totalKg > 0 ? totalCost / totalKg : 0;
  const volumeTotal = perKg * (Number(volume) || 0);

  return {
    rows,
    totalCost,
    totalKg,
    perKg,
    volume,
    volumeTotal
  };
}

/**
 * Якщо хочеш: “застосувати” дефолти в AppState (без DOM).
 * Корисно при старті або коли змінився список активних компонентів.
 */
export function normalizeFeedCalculatorArrays(AppState) {
  const active = getActiveFeedComponents(AppState);

  if (!AppState.feedCalculator) AppState.feedCalculator = { qty: [], price: [], volume: 25 };
  if (!Array.isArray(AppState.feedCalculator.qty)) AppState.feedCalculator.qty = [];
  if (!Array.isArray(AppState.feedCalculator.price)) AppState.feedCalculator.price = [];

  active.forEach((c, i) => {
    AppState.feedCalculator.qty[i] = Number(AppState.feedCalculator.qty[i] ?? c.defaultQty ?? 0);
    AppState.feedCalculator.price[i] = Number(AppState.feedCalculator.price[i] ?? 0);
  });

  // якщо активних стало менше — обрізати хвіст
  AppState.feedCalculator.qty = AppState.feedCalculator.qty.slice(0, active.length);
  AppState.feedCalculator.price = AppState.feedCalculator.price.slice(0, active.length);

  AppState.feedCalculator.volume = Number(AppState.feedCalculator.volume ?? 25);
}