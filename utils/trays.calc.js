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
  const TRAY_CAPACITY = 20; // 🔧 1 лоток = 20 яєць

  const records = AppState.eggs?.records || {};
  const shipped = AppState.warehouse?.traysShipped || 0;

  let totalGoodEggs = 0;

  // 1️⃣ сумуємо ВСІ good яйця
  Object.values(records).forEach(e => {
    totalGoodEggs += Number(e.good || 0);
  });

  // 2️⃣ повні лотки
  const totalTrays = Math.floor(totalGoodEggs / TRAY_CAPACITY);

  // 3️⃣ залишок яєць
  const leftoverEggs = totalGoodEggs % TRAY_CAPACITY;

  // 4️⃣ доступні лотки на складі
  const availableTrays = Math.max(
    totalTrays - shipped,
    0
  );

  return {
    trayCapacity: TRAY_CAPACITY,
    totalGoodEggs,
    totalTrays,
    shippedTrays: shipped,
    availableTrays,
    leftoverEggs
  };
}