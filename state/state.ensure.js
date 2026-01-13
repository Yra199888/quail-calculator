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

/* =========================
   ДЕФОЛТНІ КОМПОНЕНТИ КОРМУ
   ========================= */
const DEFAULT_FEED_COMPONENTS = [
  { id: "corn",      name: "Кукурудза",            kg: 10,   price: 0 },
  { id: "wheat",     name: "Пшениця",              kg: 5,    price: 0 },
  { id: "barley",    name: "Ячмінь",               kg: 1.5,  price: 0 },
  { id: "soy",       name: "Соєва макуха",          kg: 3,    price: 0 },
  { id: "sunflower", name: "Соняшникова макуха",   kg: 2.5,  price: 0 },
  { id: "fish",      name: "Рибне борошно",        kg: 1,    price: 0 },
  { id: "yeast",     name: "Кормові дріжджі",      kg: 0.7,  price: 0 },
  { id: "tcp",       name: "Трикальційфосфат",     kg: 0.5,  price: 0 },
  { id: "salt",      name: "Сіль",                 kg: 0.05, price: 0 },
  { id: "premix",    name: "Премікс / Dolfos",     kg: 0.1,  price: 0 }
];

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

  if (!AppState.ui.page) AppState.ui.page = "feed";
  if (typeof AppState.ui.eggsEditEnabled !== "boolean") AppState.ui.eggsEditEnabled = false;
  if (typeof AppState.ui.warehouseEditEnabled !== "boolean") AppState.ui.warehouseEditEnabled = false;

  // =========================
  // ЯЙЦЯ
  // =========================
  if (!AppState.eggs) AppState.eggs = { records: {} };
  if (!AppState.eggs.records) AppState.eggs.records = {};

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

  if (!Array.isArray(AppState.feedCalculator.qty)) AppState.feedCalculator.qty = [];
  if (!Array.isArray(AppState.feedCalculator.price)) AppState.feedCalculator.price = [];

  if (!AppState.feedCalculator.totals) {
    AppState.feedCalculator.totals = {
      totalKg: 0,
      totalCost: 0,
      perKg: 0
    };
  }

  // =========================
  // FEED CALCULATOR — МІГРАЦІЯ НА qtyById / priceById
  // =========================
  if (!AppState.feedCalculator.qtyById || typeof AppState.feedCalculator.qtyById !== "object") {
    AppState.feedCalculator.qtyById = {};
  }

  if (!AppState.feedCalculator.priceById || typeof AppState.feedCalculator.priceById !== "object") {
    AppState.feedCalculator.priceById = {};
  }

  const hasOldArrays =
    Array.isArray(AppState.feedCalculator.qty) ||
    Array.isArray(AppState.feedCalculator.price);

  const byIdIsEmpty =
    Object.keys(AppState.feedCalculator.qtyById).length === 0 &&
    Object.keys(AppState.feedCalculator.priceById).length === 0;

  if (hasOldArrays && byIdIsEmpty && Array.isArray(AppState.feedComponents)) {
    const qtyArr = Array.isArray(AppState.feedCalculator.qty)
      ? AppState.feedCalculator.qty
      : [];
    const priceArr = Array.isArray(AppState.feedCalculator.price)
      ? AppState.feedCalculator.price
      : [];

    AppState.feedComponents.forEach((c, i) => {
      if (!c || !c.id) return;

      const q = Number(qtyArr[i]);
      const p = Number(priceArr[i]);

      if (!Number.isNaN(q)) AppState.feedCalculator.qtyById[c.id] = q;
      if (!Number.isNaN(p)) AppState.feedCalculator.priceById[c.id] = p;
    });

    AppState.feedCalculator.qty = [];
    AppState.feedCalculator.price = [];
  }

  // =========================
  // КОМПОНЕНТИ КОРМУ
  // =========================
  if (!Array.isArray(AppState.feedComponents)) {
    AppState.feedComponents = [];
  }

  if (AppState.feedComponents.length === 0) {
    AppState.feedComponents = structuredClone(DEFAULT_FEED_COMPONENTS);
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

  if (!AppState.warehouse.feed) AppState.warehouse.feed = {};
  if (!AppState.warehouse.minimums) AppState.warehouse.minimums = {};

  AppState.warehouse.trays = Number(AppState.warehouse.trays || 0);
  AppState.warehouse.reserved = Number(AppState.warehouse.reserved || 0);

  // =========================
  // ЗАМОВЛЕННЯ
  // =========================
  if (!AppState.orders) AppState.orders = { list: [] };
  if (!Array.isArray(AppState.orders.list)) AppState.orders.list = [];

  // =========================
  // РЕЦЕПТИ
  // =========================
  if (!AppState.recipes) {
    AppState.recipes = {
      list: {},
      selectedId: null
    };
  }

  if (!AppState.recipes.list) AppState.recipes.list = {};
  if (!("selectedId" in AppState.recipes)) AppState.recipes.selectedId = null;
  
  // ✅ cages
AppState.cages ||= { list: [] };
if (!Array.isArray(AppState.cages.list)) AppState.cages.list = [];

AppState.ui ||= {};
AppState.ui.cages ||= {};

  // =========================
// 🧾 ЖУРНАЛ ПОДІЙ
// =========================
if (!AppState.logs) {
  AppState.logs = {
    list: []
  };
}

if (!Array.isArray(AppState.logs.list)) {
  AppState.logs.list = [];
}
}