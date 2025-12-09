/* ============================================================
   core/data.js
   ЄДИНИЙ GLOBAL DATA OBJECT (FULL ENTERPRISE MODE)
   ============================================================ */

export const DATA = {
    feed: {
        stock: {},          // запаси компонентів
        recipe: {},         // активний рецепт
        ready: 0,           // готовий комбікорм
        dailyNeed: 0        // добова потреба
    },

    eggs: {
        todayTotal: 0,
        todayBad: 0,
        todayOwn: 0,
        carry: 0,
        price: 0,
        productivity: {
            hens1: 0,
            hens2: 0
        },
        history: []         // історія по днях
    },

    orders: [],             // Активні + виконані (done=true)
    clients: {},            // Автоматично генерується з orders

    finance: {
        logs: [],           // ручні витрати
        reports: {}         // останній звіт
    },

    incub: [],              // Окремі партії

    flock: {
        males: 0,
        females: 0,
        deaths: 0,
        avgAge: 0
    },

    lastSync: null          // timestamp останньої синхронізації
};