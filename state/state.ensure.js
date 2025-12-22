/**
 * 🧠 state.ensure.js
 * ---------------------------------------
 * Гарантує, що AppState має правильну структуру
 * (дефолтні значення, відсутні поля)
 *
 * ❗ НЕ:
 * - не читає localStorage
 * - не зберігає
 * - не рендерить
 */

import { AppState } from "./AppState.js";

export function ensureState() {
  // =========================
  // ЯЙЦЯ
  // =========================
  if (!AppState.eggs) AppState.eggs = {};
  if (!AppState.eggs.records) AppState.eggs.records = {};

  // =========================
  // КОРМ
  // =========================
  if (!AppState.feedCalculator) {
    AppState.feedCalculator = {
      qty: [],
      price: [],
      volume: 0,
      totals: {
        totalKg: 0,
        totalCost: 0,
        perKg: 0
      }
    };
  }

  // =========================
  // КОМПОНЕНТИ КОРМУ
  // =========================
  if (!Array.isArray(AppState.feedComponents)) {
    AppState.feedComponents = [];
  }

  // =========================
  // СКЛАД
  // =========================
  if (!AppState.warehouse) {
    AppState.warehouse = {
      feed: {},
      trays: 0,
      reserved: 0,
      minimums: {}
    };
  }

  // =========================
  // ЗАМОВЛЕННЯ
  // =========================
  if (!AppState.orders) {
    AppState.orders = {
      list: []
    };
  }

  // =========================
  // РЕЦЕПТИ
  // =========================
  if (!AppState.recipes) {
    AppState.recipes = {
      list: {},
      selectedId: null
    };
  }
}