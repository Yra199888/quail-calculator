/**
 * 🥚 trays.service.js
 * ---------------------------------------
 * Логіка лотків (20 яєць = 1 лоток)
 *
 * ❌ без render
 * ❌ без Firebase
 * ❌ без localStorage
 *
 * ✅ ТІЛЬКИ обчислення
 */

import { AppState } from "../state/AppState.js";

export const EGGS_PER_TRAY = 20;

/**
 * 🔢 Загальна кількість яєць
 */
export function getTotalEggs() {
  const records = AppState.eggs.records || {};

  return Object.values(records).reduce((sum, e) => {
    return sum + Number(e.good || 0);
  }, 0);
}

/**
 * 📦 Повні лотки
 */
export function getFullTrays() {
  return Math.floor(getTotalEggs() / EGGS_PER_TRAY);
}

/**
 * 🥚 Залишок яєць
 */
export function getEggsRemainder() {
  return getTotalEggs() % EGGS_PER_TRAY;
}