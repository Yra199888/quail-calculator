/**
 * 🧠 state.ensure.js
 * ---------------------------------------
 * Гарантує, що AppState має правильну структуру.
 *
 * ❗ НЕ:
 * - не читає localStorage
 * - не зберігає
 * - не працює з DOM
 */

import { AppState } from "./AppState.js";

export function ensureState() {
  // =========================
  // UI / НАВІГАЦІЯ
  // =========================
  if (!AppState.ui) {
    AppState.ui = {
      page: "feed",
      eggsEditEnabled: false,
      warehouseEditEnabled: false
    };
  }

  if (!AppState.ui.page) {
    AppState.ui.page = "feed";
  }

  if (typeof AppState.ui.eggsEditEnabled !== "boolean") {
    AppState.ui.eggsEditEnabled = false;
  }

  if (typeof AppState.ui.warehouseEditEnabled !== "boolean") {
    AppState.ui.warehouseEditEnabled = false;
  }

  // =========================
  // ЯЙЦЯ
  // =========================
  if (!AppState.eggs) {
    AppState.eggs = {
      records: {}
    };
  }

  if (!AppState.eggs.records) {
    AppState.eggs.records = {};
  }

  // =========================
  // КАЛЬКУЛЯТОР КОРМУ
  // =========================
  if (!AppState.feedCalculator) {
    AppState.feedCalculator = {
      qty: [],
      price: [],
      volume: 25,
      totals: {
        totalKg: 0,
        totalCost: 0,
        perKg: 0
      }
    };
  }

  if (!Array.isArray(AppState.feedCalculator.qty)) {
    AppState.feedCalculator.qty = [];
  }

  if (!Array.isArray(AppState.feedCalculator.price)) {
    AppState.feedCalculator.price = [];
  }

  if (!AppState.feedCalculator.totals) {
    AppState.feedCalculator.totals = {
      totalKg: 0,
      totalCost: 0,
      perKg: 0
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

  if (!AppState.warehouse.feed) {
    AppState.warehouse.feed = {};
  }

  if (!AppState.warehouse.minimums) {
    AppState.warehouse.minimums = {};
  }

  AppState.warehouse.trays = Number(AppState.warehouse.trays || 0);
  AppState.warehouse.reserved = Number(AppState.warehouse.reserved || 0);

  // =========================
  // ЗАМОВЛЕННЯ
  // =========================
  if (!AppState.orders) {
    AppState.orders = {
      list: []
    };
  }

  if (!Array.isArray(AppState.orders.list)) {
    AppState.orders.list = [];
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

  if (!AppState.recipes.list) {
    AppState.recipes.list = {};
  }

  if (!("selectedId" in AppState.recipes)) {
    AppState.recipes.selectedId = null;
  }
}