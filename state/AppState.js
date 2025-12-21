// ============================
// AppState — ЄДИНЕ ДЖЕРЕЛО ДАНИХ
// ============================

export const AppState = {
  // ============================
  // UI / НАВІГАЦІЯ
  // ============================
  ui: {
    page: "calculator",        // calculator | eggs | warehouse | orders | settings
    eggsEditEnabled: false,
    warehouseEditEnabled: false,
    theme: "dark"              // dark | light
  },

  // ============================
  // ЯЙЦЯ
  // ============================
  eggs: {
    records: {
      // "2025-01-01": { good: 100, bad: 5, home: 10 }
    },
    carry: 0,
    totalTrays: 0
  },

  // ============================
  // СКЛАД
  // ============================
  warehouse: {
    feed: {
      // kukurudza: 50,
      // pshenytsia: 20
    },
    trays: 0,
    ready: 0,
    reserved: 0,
    minimums: {
      // kukurudza: 10,
      // empty_trays: 5
    },
    history: []
  },

  // ============================
  // КОМПОНЕНТИ КОРМУ (динамічні)
  // ============================
  feedComponents: [
    // {
    //   id: "kukurudza",
    //   name: "Кукурудза",
    //   defaultQty: 10,
    //   enabled: true
    // }
  ],

  // ============================
  // КАЛЬКУЛЯТОР КОРМУ
  // ============================
  feedCalculator: {
    qty: [],        // по індексу активних компонентів
    price: [],      // по індексу активних компонентів
    volume: 25
  },

  // ============================
  // РЕЦЕПТИ
  // ============================
  recipes: {
    list: {
      // recipe_id: {
      //   id,
      //   name,
      //   volume,
      //   components: { kukurudza: 10 }
      // }
    },
    selectedId: null
  },

  // ============================
  // ІСТОРІЯ ЗАМІСІВ
  // ============================
  feedMixes: {
    history: [
      // {
      //   id,
      //   createdAt,
      //   recipeName,
      //   volume,
      //   components,
      //   totalCost,
      //   perKg
      // }
    ]
  },

  // ============================
  // ЗАМОВЛЕННЯ
  // ============================
  orders: {
    list: [
      // {
      //   id,
      //   date,
      //   client,
      //   trays,
      //   status,        // draft | confirmed | delivered | cancelled
      //   details,
      //   createdAt,
      //   updatedAt
      // }
    ]
  }
};