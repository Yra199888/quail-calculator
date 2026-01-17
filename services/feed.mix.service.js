/**
 * feed.mix.service.js
 * ---------------------------------------
 * Бізнес-логіка:
 * - змішування корму
 * - списання зі складу
 * - логування
 */

import { AppState } from "../state/AppState.js";
import { getFeedStock, consumeFeedStock } from "./warehouse.service.js";

export function mixFeedAndConsumeFromWarehouse(recipe) {
  if (!recipe || !Array.isArray(recipe.items)) {
    return { ok: false, error: "❌ Рецепт не знайдено" };
  }

  // беремо тільки активні компоненти з дозуванням
  const items = recipe.items
    .filter(i => i.enabled && Number(i.amount) > 0)
    .map(i => ({
      componentId: i.componentId,
      amount: Number(i.amount)
    }));

  if (!items.length) {
    return { ok: false, error: "❌ У рецепті немає активних компонентів" };
  }

  // 1️⃣ Перевірка складу
  for (const i of items) {
    const stock = getFeedStock(i.componentId);
    if (stock < i.amount) {
      return {
        ok: false,
        error: `❌ Недостатньо на складі: ${i.componentId} (${stock} кг)`
      };
    }
  }

  // 2️⃣ Списання
  for (const i of items) {
    const success = consumeFeedStock(i.componentId, i.amount);
    if (!success) {
      return {
        ok: false,
        error: `❌ Помилка списання: ${i.componentId}`
      };
    }
  }

  // 3️⃣ ЛОГ (один запис)
  AppState.logs ||= { list: [] };

  AppState.logs.list.unshift({
    id: crypto.randomUUID(),
    type: "feed:mix",
    payload: {
      items
    },
    createdAt: new Date().toISOString()
  });

  return { ok: true };
}