// src/state/AppState.js
// ЄДИНЕ джерело правди. ТІЛЬКИ ДАНІ. ЖОДНОЇ ЛОГІКИ.

export const AppState = {
  // =========================
  // UI
  // =========================
  ui: {
    page: "calculator",
    eggsEditEnabled: false,
    warehouseEditEnabled: false,
    theme: "dark"
  },

  // =========================
  // FEED COMPONENTS
  // =========================
  feedComponents: [
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
  ],

  // =========================
  // FEED CALCULATOR
  // =========================
  feedCalculator: {
    qty: [],
    price: [],
    volume: 25
  },

  // =========================
  // WAREHOUSE
  // =========================
  warehouse: {
    feed: {},              // { componentId: kg }
    trays: 0,
    ready: 0,
    reserved: 0,
    minimums: {}           // { componentId: minKg }
  },

  // =========================
  // FEED MIXES (HISTORY)
  // =========================
  feedMixes: {
    history: []
  },

  // =========================
  // EGGS
  // =========================
  eggs: {
    records: {},           // { date: { good, bad, home, trays, remainder } }
    carry: 0,
    totalTrays: 0
  },

  // =========================
  // RECIPES
  // =========================
  recipes: {
    list: {},              // { id: { id, name, volume, components } }
    selectedId: null
  },

  // =========================
  // ORDERS
  // =========================
  orders: {
    list: []               // [{ id, date, client, trays, status }]
  }
};