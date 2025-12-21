// state/state.ensure.js
import { AppState } from "./AppState.js";

// ============================
// ENSURE HELPERS
// ============================
function ensureObject(obj, fallback = {}) {
  return obj && typeof obj === "object" ? obj : fallback;
}

function ensureArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function ensureNumber(val, def = 0) {
  return Number.isFinite(Number(val)) ? Number(val) : def;
}

// ============================
// MAIN ENSURE
// ============================
export function ensureAppState() {
  // ============================
  // UI
  // ============================
  AppState.ui = ensureObject(AppState.ui, {});
  AppState.ui.page = AppState.ui.page || "calculator";
  AppState.ui.eggsEditEnabled = !!AppState.ui.eggsEditEnabled;
  AppState.ui.warehouseEditEnabled = !!AppState.ui.warehouseEditEnabled;
  AppState.ui.theme = AppState.ui.theme || "dark";

  // ============================
  // EGGS
  // ============================
  AppState.eggs = ensureObject(AppState.eggs, {});
  AppState.eggs.records = ensureObject(AppState.eggs.records, {});
  AppState.eggs.carry = ensureNumber(AppState.eggs.carry);
  AppState.eggs.totalTrays = ensureNumber(AppState.eggs.totalTrays);

  // ============================
  // WAREHOUSE
  // ============================
  AppState.warehouse = ensureObject(AppState.warehouse, {});
  AppState.warehouse.feed = ensureObject(AppState.warehouse.feed, {});
  AppState.warehouse.trays = ensureNumber(AppState.warehouse.trays);
  AppState.warehouse.ready = ensureNumber(AppState.warehouse.ready);
  AppState.warehouse.reserved = ensureNumber(AppState.warehouse.reserved);
  AppState.warehouse.history = ensureArray(AppState.warehouse.history);
  AppState.warehouse.minimums = ensureObject(AppState.warehouse.minimums, {});

  // ============================
  // FEED COMPONENTS
  // ============================
  AppState.feedComponents = ensureArray(AppState.feedComponents);

  AppState.feedComponents = AppState.feedComponents
    .map(c => ({
      id: String(c.id || "").trim(),
      name: String(c.name || "").trim(),
      defaultQty: ensureNumber(c.defaultQty),
      enabled: c.enabled !== false
    }))
    .filter(c => c.id && c.name);

  // ============================
  // FEED CALCULATOR
  // ============================
  AppState.feedCalculator = ensureObject(AppState.feedCalculator, {});
  AppState.feedCalculator.qty = ensureArray(AppState.feedCalculator.qty);
  AppState.feedCalculator.price = ensureArray(AppState.feedCalculator.price);
  AppState.feedCalculator.volume = ensureNumber(
    AppState.feedCalculator.volume,
    25
  );

  // ============================
  // RECIPES
  // ============================
  AppState.recipes = ensureObject(AppState.recipes, {});
  AppState.recipes.list = ensureObject(AppState.recipes.list, {});
  AppState.recipes.selectedId =
    AppState.recipes.selectedId || null;

  // ============================
  // FEED MIXES
  // ============================
  AppState.feedMixes = ensureObject(AppState.feedMixes, {});
  AppState.feedMixes.history = ensureArray(
    AppState.feedMixes.history
  );

  // ============================
  // ORDERS
  // ============================
  AppState.orders = ensureObject(AppState.orders, {});
  AppState.orders.list = ensureArray(AppState.orders.list);
}