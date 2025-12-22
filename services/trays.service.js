import { AppState } from "../state/AppState.js";

const EGGS_PER_TRAY = 20; // ✅ 20 яєць = 1 лоток

export function getEggsStats() {
  const records = AppState.eggs.records || {};

  let totalEggs = 0;

  Object.values(records).forEach(e => {
    totalEggs += Number(e.good || 0);
  });

  const fullTrays = Math.floor(totalEggs / EGGS_PER_TRAY);
  const restEggs = totalEggs % EGGS_PER_TRAY;

  return {
    totalEggs,
    fullTrays,
    restEggs
  };
}

export function getSoldTrays() {
  const orders = AppState.orders?.list || [];
  return orders.reduce((sum, o) => sum + Number(o.trays || 0), 0);
}

export function getAvailableTrays() {
  const { fullTrays } = getEggsStats();
  const sold = getSoldTrays();
  return Math.max(0, fullTrays - sold);
}