// src/state/AppState.js

export const AppState = {
  // =========================
  // UI / NAVIGATION
  // =========================
  ui: {
    page: "calculator",
    eggsEditEnabled: false,
    warehouseEditEnabled: false,
    theme: "dark",
  },

  // =========================
  // FEED COMPONENTS (MASTER LIST)
  // =========================
  feedComponents: [
    // { id, name, defaultQty, enabled }
  ],

  // =========================
  // FEED CALCULATOR (CURRENT FORM STATE)
  // =========================
  feedCalculator: {
    qty: [],        // відповідає активним feedComponents
    price: [],      // відповідає активним feedComponents
    volume: 25
  },

  // =========================
  // FEED RECIPES
  // =========================
  recipes: {
    list: {
      // recipeId: { id, name, volume, components:{ componentId: qty } }
    },
    selectedId: null
  },

  // =========================
  // FEED MIX HISTORY
  // =========================
  feedMixes: {
    history: [
      // { id, createdAt, recipeName, volume, components }
    ]
  },

  // =========================
  // WAREHOUSE
  // =========================
  warehouse: {
    feed: {
      // componentId: qty
    },
    trays: 0,
    ready: 0,
    reserved: 0,
    minimums: {
      // componentId: minQty
      empty_trays: 0
    }
  },

  // =========================
  // EGGS
  // =========================
  eggs: {
    records: {
      // date: { good, bad, home, trays, remainder, carryIn }
    },
    carry: 0,
    totalTrays: 0
  },

  // =========================
  // ORDERS
  // =========================
  orders: {
    list: [
      // { id, date, client, trays, status }
    ]
  }
};