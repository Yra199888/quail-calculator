/**
 * feed.mix.service.js
 * ---------------------------------------
 * Бізнес-логіка змішування корму
 *
 * ❌ БЕЗ UI
 * ❌ БЕЗ DOM
 * ❌ БЕЗ Controller
 *
 * ✅ Використовує існуючі сервіси
 * ✅ Списує компоненти зі складу
 * ✅ Пише лог
 */

import { AppState } from "../state/AppState.js";
import { consumeFeedStock, getFeedStock } from "./warehouse.service.js";
import { addLog } from "./logs.service.js";

/**
 * Змішати корм згідно калькулятора
 */
export function mixFeedFromCalculator() {
  const components = (AppState.feedComponents || []).filter(
    c => c.deleted !== true && c.enabled !== false
  );

  if (!components.length) {
    return { ok: false, error: "Немає активних компонентів для змішування" };
  }

  const qtyById = AppState.feedCalculator?.qtyById || {};

  // 1️⃣ Перевірка наявності на складі
  for (const c of components) {
    const need = Number(qtyById[c.id] ?? c.kg ?? 0);
    if (need <= 0) continue;

    const available = getFeedStock(c.id);
    if (available < need) {
      return {
        ok: false,
        error: `Недостатньо компонента: ${c.name} (${available} / ${need} кг)`
      };
    }
  }

  // 2️⃣ Списання компонентів
  components.forEach(c => {
    const need = Number(qtyById[c.id] ?? c.kg ?? 0);
    if (need > 0) {
      consumeFeedStock(c.id, need);
    }
  });

  // 3️⃣ Лог
  addLog({
    type: "feed:mix",
    payload: {
      items: components
        .map(c => ({
          componentId: c.id,
          amount: Number(qtyById[c.id] ?? c.kg ?? 0)
        }))
        .filter(i => i.amount > 0)
    }
  });

  return { ok: true };
}