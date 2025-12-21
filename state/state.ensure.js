/**
 * 🛡 state.ensure.js
 * Гарантує коректну форму AppState
 *
 * ❗ Правила:
 * - НЕ рендерить
 * - НЕ читає DOM
 * - НЕ пише в localStorage
 * - НЕ робить обчислень
 */

import { AppState } from "./AppState.js";

/**
 * 🔹 Головна точка
 */
export function ensureAppStateShape() {
  ensureUI();
  ensureFeedComponents();
  ensureFeedCalculator();
  ensureRecipes();
  ensureFeedMixes();
  ensureWarehouse();
  ensureEggs();
  ensureOrders();
}

// ============================
// UI
// ============================
function ensureUI() {
  AppState.ui ??= {};
  AppState.ui.page ??= "feed";
  AppState.ui.eggsEditEnabled ??= false;
  AppState.ui.warehouseEditEnabled ??= false;
}

// ============================
// КОМПОНЕНТИ КОРМУ
// ============================
function ensureFeedComponents() {
  if (!Array.isArray(AppState.feedComponents)) {
    AppState.feedComponents = [];
  }

  // дефолтні компоненти — тільки якщо список порожній
  if (AppState.feedComponents.length === 0) {
    AppState.feedComponents.push(
      { id: "kukurudza", name: "Кукурудза", defaultQty: 10, enabled: true },
      { id: "pshenytsia", name: "Пшениця", defaultQty: 5, enabled: true },
      { id: "yachmin", name: "Ячмінь", defaultQty: 1.5, enabled: true },
      { id: "soieva_makuha", name: "Соева макуха", defaultQty: 3, enabled: true },
      { id: "soniashnykova_makuha", name: "Соняшникова макуха", defaultQty: 2.5, enabled: true },
      { id: "rybne_boroshno", name: "Рибне борошно", defaultQty: 1, enabled: true },
      { id: "drizhdzhi", name: "Дріжджі", defaultQty: 0.7, enabled: true },
      { id: "trykaltsii_fosfat", name: "Трикальційфосфат", defaultQty: 0.5, enabled: true },
      { id: "dolfos_d", name: "Dolfos D", defaultQty: 0.7, enabled: true },
      { id: "sil", name: "Сіль", defaultQty: 0.05, enabled: true }
    );
  }

  // нормалізація кожного компонента
  AppState.feedComponents = AppState.feedComponents
    .map(c => ({
      id: String(c.id || "").trim(),
      name: String(c.name || "").trim(),
      defaultQty: Number(c.defaultQty || 0),
      enabled: c.enabled !== false
    }))
    .filter(c => c.id && c.name);
}

// ============================
// КАЛЬКУЛЯТОР КОРМУ
// ============================
function ensureFeedCalculator() {
  AppState.feedCalculator ??= {};
  AppState.feedCalculator.qty ??= [];
  AppState.feedCalculator.price ??= [];
  AppState.feedCalculator.volume ??= 25;

  AppState.feedCalculator.totals ??= {};
  AppState.feedCalculator.totals.totalKg ??= 0;
  AppState.feedCalculator.totals.totalCost ??= 0;
  AppState.feedCalculator.totals.perKg ??= 0;
}

// ============================
// РЕЦЕПТИ
// ============================
function ensureRecipes() {
  AppState.recipes ??= {};
  AppState.recipes.list ??= {};
  AppState.recipes.selectedId ??= null;
}

// ============================
// ІСТОРІЯ ЗАМІСІВ
// ============================
function ensureFeedMixes() {
  AppState.feedMixes ??= {};
  AppState.feedMixes.history ??= [];

  if (!Array.isArray(AppState.feedMixes.history)) {
    AppState.feedMixes.history = [];
  }
}

// ============================
// СКЛАД
// ============================
function ensureWarehouse() {
  AppState.warehouse ??= {};

  AppState.warehouse.feed ??= {};
  AppState.warehouse.trays ??= 0;
  AppState.warehouse.ready ??= 0;
  AppState.warehouse.reserved ??= 0;
  AppState.warehouse.minimums ??= {};

  // гарантуємо наявність всіх компонентів на складі
  AppState.feedComponents.forEach(c => {
    AppState.warehouse.feed[c.id] ??= 0;
  });
}

// ============================
// ЯЙЦЯ
// ============================
function ensureEggs() {
  AppState.eggs ??= {};
  AppState.eggs.records ??= {};
  AppState.eggs.carry ??= 0;
  AppState.eggs.totalTrays ??= 0;
}

// ============================
// ЗАМОВЛЕННЯ
// ============================
function ensureOrders() {
  AppState.orders ??= {};
  AppState.orders.list ??= [];

  if (!Array.isArray(AppState.orders.list)) {
    AppState.orders.list = [];
  }
}