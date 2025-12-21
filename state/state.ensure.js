// src/state/state.ensure.js

import { AppState } from "./AppState.js";

/**
 * Головна точка забезпечення структури
 * Викликається ОДИН раз при старті
 */
export function ensureAppState() {
  ensureUI();
  ensureWarehouse();
  ensureEggs();
  ensureFeedCalculator();
  ensureFeedComponents();
  ensureRecipes();
  ensureFeedMixes();
  ensureOrders();
}

/* =========================
   UI
========================= */
function ensureUI() {
  AppState.ui ??= {};
  AppState.ui.page ??= "calculator";
  AppState.ui.eggsEditEnabled ??= false;
  AppState.ui.warehouseEditEnabled ??= false;
}

/* =========================
   WAREHOUSE
========================= */
function ensureWarehouse() {
  AppState.warehouse ??= {};
  AppState.warehouse.feed ??= {};
  AppState.warehouse.feed.stock ??= {};
  AppState.warehouse.trays ??= 0;
  AppState.warehouse.ready ??= 0;
  AppState.warehouse.reserved ??= 0;
  AppState.warehouse.minimums ??= {};
}

/* =========================
   EGGS
========================= */
function ensureEggs() {
  AppState.eggs ??= {};
  AppState.eggs.records ??= {};
  AppState.eggs.carry ??= 0;
  AppState.eggs.totalTrays ??= 0;
}

/* =========================
   FEED CALCULATOR
========================= */
function ensureFeedCalculator() {
  AppState.feedCalculator ??= {};
  AppState.feedCalculator.qty ??= [];
  AppState.feedCalculator.price ??= [];
  AppState.feedCalculator.volume ??= 25;
}

/* =========================
   FEED COMPONENTS
========================= */
function ensureFeedComponents() {
  if (!Array.isArray(AppState.feedComponents)) {
    AppState.feedComponents = [];
  }

  if (AppState.feedComponents.length === 0) {
    AppState.feedComponents = [
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
    ];
  }

  AppState.feedComponents = AppState.feedComponents
    .map(c => ({
      id: String(c.id || "").trim(),
      name: String(c.name || "").trim(),
      defaultQty: Number(c.defaultQty || 0),
      enabled: c.enabled !== false
    }))
    .filter(c => c.id && c.name);
}

/* =========================
   RECIPES
========================= */
function ensureRecipes() {
  AppState.recipes ??= {};
  AppState.recipes.list ??= {};
  AppState.recipes.selectedId ??= null;
}

/* =========================
   FEED MIXES
========================= */
function ensureFeedMixes() {
  AppState.feedMixes ??= {};
  AppState.feedMixes.history ??= [];
}

/* =========================
   ORDERS
========================= */
function ensureOrders() {
  AppState.orders ??= {};
  AppState.orders.list ??= [];
}