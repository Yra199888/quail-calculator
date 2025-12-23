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

  // 🧺 ВИКОНАНІ лотки
  // якщо fulfilled є — використовуємо його
  // якщо ні — fallback на trays (старі замовлення)
  const shippedTrays = orders
    .filter(o => o.status === "done" || o.status === "partial")
    .reduce((sum, o) => {
      const fulfilled =
        typeof o.fulfilled === "number"
          ? o.fulfilled
          : (o.status === "done" ? Number(o.trays || 0) : 0);

      return sum + fulfilled;
    }, 0);

  // 🟡 ЗАБРОНЬОВАНІ, але ще не видані
  const reservedTrays = orders
    .filter(o => o.status === "reserved" || o.status === "partial")
    .reduce((sum, o) => {
      const trays = Number(o.trays || 0);
      const fulfilled = Number(o.fulfilled || 0);
      return sum + Math.max(trays - fulfilled, 0);
    }, 0);

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

    shippedTrays,    // 🧺 фактично видано
    reservedTrays,   // 🟡 ще потрібно видати
    availableTrays,  // 🟢 реально доступно
    deficitTrays,    // 🔴 дефіцит

    leftoverEggs: totalGoodEggs % TRAY_CAPACITY
  };
}