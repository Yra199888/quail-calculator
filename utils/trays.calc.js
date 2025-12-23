/**
 * 🧮 calcTrayStats
 * ---------------------------------------
 * ТІЛЬКИ розрахунок
 */

export function calcTrayStats(AppState) {
  const TRAY_CAPACITY = 20;

  const records = AppState.eggs?.records || {};
  const orders = AppState.orders?.list || [];
  const shipped = AppState.warehouse?.traysShipped || 0;

  let totalGoodEggs = 0;

  // 🥚 всі хороші яйця
  Object.values(records).forEach(e => {
    totalGoodEggs += Number(e.good || 0);
  });

  // 📦 повні лотки
  const totalTrays = Math.floor(totalGoodEggs / TRAY_CAPACITY);

  // 🟡 заброньовані лотки
  const reservedTrays = orders
    .filter(o => o.status === "reserved")
    .reduce((sum, o) => sum + Number(o.trays || 0), 0);

  // 📦 доступні
  const availableTrays = Math.max(
    totalTrays - shipped - reservedTrays,
    0
  );

  return {
    trayCapacity: TRAY_CAPACITY,
    totalGoodEggs,
    totalTrays,
    shippedTrays: shipped,
    reservedTrays,      // 🆕
    availableTrays,
    leftoverEggs: totalGoodEggs % TRAY_CAPACITY
  };
}