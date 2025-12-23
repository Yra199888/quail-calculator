/**
 * 🧮 calcTrayStats
 * ---------------------------------------
 * Розрахунок повних лотків із яєць
 *
 * ❌ НЕ мутує AppState
 * ❌ НЕ зберігає
 * ❌ НЕ працює з UI
 *
 * ✅ ТІЛЬКИ розрахунок
 */

export function calcTrayStats(AppState) {
  const TRAY_CAPACITY = 20; // 🥚 1 лоток = 20 яєць

  const records = AppState.eggs?.records || {};
  const orders = AppState.orders?.list || [];

  // 🧺 legacy (якщо десь ще використовується)
  const legacyShipped = AppState.warehouse?.traysShipped || 0;

  // =====================================
  // 1️⃣ СУМА ХОРОШИХ ЯЄЦЬ
  // =====================================
  let totalGoodEggs = 0;

  Object.values(records).forEach(e => {
    totalGoodEggs += Number(e.good || 0);
  });

  // =====================================
  // 2️⃣ ПОВНІ ЛОТКИ + ЗАЛИШОК
  // =====================================
  const totalTrays = Math.floor(totalGoodEggs / TRAY_CAPACITY);
  const leftoverEggs = totalGoodEggs % TRAY_CAPACITY;

  // =====================================
  // 3️⃣ ЗАМОВЛЕННЯ
  // =====================================
  let reservedTrays = 0;
  let doneTrays = 0;

  orders.forEach(o => {
    const trays = Number(o.trays || 0);

    if (o.status === "reserved") {
      reservedTrays += trays;
    }

    if (o.status === "done") {
      doneTrays += trays;
    }
  });

  // якщо ще десь списували через warehouse
  const shippedTrays = Math.max(doneTrays, legacyShipped);

  // =====================================
  // 4️⃣ ДОСТУПНІ ЛОТКИ
  // =====================================
  const availableTrays = Math.max(
    totalTrays - reservedTrays - shippedTrays,
    0
  );

  // =====================================
  // ✅ ПОВЕРТАЄМО ВСЕ (старе + нове)
  // =====================================
  return {
    trayCapacity: TRAY_CAPACITY,

    totalGoodEggs,
    totalTrays,

    reservedTrays,
    shippedTrays,
    availableTrays,

    leftoverEggs
  };
}