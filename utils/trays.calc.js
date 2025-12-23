/**
 * 🧮 calcTrayStats
 * ---------------------------------------
 * ТІЛЬКИ розрахунок
 * ❌ не мутує AppState
 * ❌ не зберігає
 */

export function calcTrayStats(AppState) {
  const TRAY_CAPACITY = 20;

  const records = AppState.eggs?.records || {};
  const orders = AppState.orders?.list || [];

  let totalGoodEggs = 0;

  // 🥚 всі хороші яйця
  Object.values(records).forEach(e => {
    totalGoodEggs += Number(e.good || 0);
  });

  // 📦 повні лотки з яєць
  const totalTrays = Math.floor(totalGoodEggs / TRAY_CAPACITY);

  // 🟡 заброньовані (orders: reserved)
  const reservedTrays = orders
    .filter(o => o.status === "reserved")
    .reduce((sum, o) => sum + Number(o.trays || 0), 0);

  // 🧺 виконані (orders: done)
  const shippedTrays = orders
    .filter(o => o.status === "done")
    .reduce((sum, o) => sum + Number(o.trays || 0), 0);

  // 📦 доступні до відвантаження
  const availableBeforeReserve = totalTrays - shippedTrays;

  const availableTrays = Math.max(
    availableBeforeReserve - reservedTrays,
    0
  );

  // ❌ дефіцит (якщо бронь > можливостей)
  const deficitTrays = Math.max(
    reservedTrays - availableBeforeReserve,
    0
  );

  return {
    trayCapacity: TRAY_CAPACITY,

    totalGoodEggs,
    totalTrays,

    shippedTrays,   // 🧺 виконано
    reservedTrays,  // 🟡 заброньовано
    availableTrays, // 🟢 доступно

    deficitTrays,   // 🆕 ДОДАНО (але ніщо не ламає)

    leftoverEggs: totalGoodEggs % TRAY_CAPACITY
  };
}