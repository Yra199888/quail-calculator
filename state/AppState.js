// src/state/AppState.js
// ЄДИНЕ ДЖЕРЕЛО ДАНИХ ДОДАТКУ
// Без логіки, без DOM, без side-effects

export const AppState = {
  // =====================================================
  // UI / NAVIGATION / GLOBAL FLAGS
  // =====================================================
  ui: {
    page: "calculator",          // active page
    eggsEditEnabled: false,      // toggle eggs editing
    warehouseEditEnabled: false, // toggle warehouse editing
    theme: "dark",               // dark | light
  },

  // =====================================================
  // FEED COMPONENTS (MASTER LIST)
  // =====================================================
  // Це єдина таблиця компонентів корму
  // Все інше (склад, калькулятор, рецепти) посилається ТІЛЬКИ по id
  feedComponents: [
    // {
    //   id: "kukurudza",
    //   name: "Кукурудза",
    //   defaultQty: 10,
    //   enabled: true
    // }
  ],

  // =====================================================
  // FEED CALCULATOR (CURRENT FORM STATE)
  // =====================================================
  // Порядок масивів ЗАВЖДИ відповідає getActiveFeedComponents()
  feedCalculator: {
    qty: [],        // number[] — кг кожного активного компонента
    price: [],      // number[] — ціна за кг
    volume: 25      // number — обʼєм замісу
  },

  // =====================================================
  // FEED RECIPES
  // =====================================================
  recipes: {
    // recipeId -> recipe
    list: {
      // recipe_123: {
      //   id: "recipe_123",
      //   name: "Несучка стандарт",
      //   volume: 25,
      //   components: {
      //     kukurudza: 10,
      //     pshenytsia: 5
      //   }
      // }
    },
    selectedId: null
  },

  // =====================================================
  // FEED MIX HISTORY
  // =====================================================
  feedMixes: {
    history: [
      // {
      //   id: "mix_123",
      //   createdAt: "2025-01-01T12:00:00Z",
      //   recipeName: "Несучка стандарт",
      //   volume: 25,
      //   components: {
      //     kukurudza: 10,
      //     pshenytsia: 5
      //   }
      // }
    ]
  },

  // =====================================================
  // WAREHOUSE
  // =====================================================
  warehouse: {
    // залишки кормових компонентів
    feed: {
      // kukurudza: 120,
      // pshenytsia: 80
    },

    // лотки
    trays: 0,        // порожні лотки
    ready: 0,        // готові (після recompute)
    reserved: 0,     // зарезервовані під замовлення

    // мінімальні запаси (для попереджень)
    minimums: {
      // kukurudza: 20,
      // empty_trays: 50
    }
  },

  // =====================================================
  // EGGS
  // =====================================================
  eggs: {
    // щоденні записи
    records: {
      // "2025-01-01": {
      //   good: 120,
      //   bad: 3,
      //   home: 10,
      //   commercial: 107,
      //   carryIn: 5,
      //   trays: 5,
      //   remainder: 7
      // }
    },

    carry: 0,        // залишок яєць
    totalTrays: 0   // всього сформовано лотків
  },

  // =====================================================
  // ORDERS
  // =====================================================
  orders: {
    list: [
      // {
      //   id: "order_123",
      //   date: "2025-01-02",
      //   client: "Магазин №1",
      //   trays: 10,
      //   details: "",
      //   status: "confirmed", // draft | confirmed | delivered | cancelled
      //   createdAt: "2025-01-01T10:00:00Z",
      //   updatedAt: "2025-01-01T10:00:00Z"
      // }
    ]
  }
};