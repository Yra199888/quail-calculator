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