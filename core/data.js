// data.js
// Єдиний глобальний об'єкт для всіх розрахунків

window.DATA = {
    feed: {
        // ТВОЙ ФІКСОВАНИЙ РЕЦЕПТ НА 25 КГ
        recipeKg: {
            "Кукурудза": 10.0,
            "Пшениця": 5.0,
            "Ячмінь": 1.5,
            "Соєва макуха": 3.0,
            "Соняшникова макуха": 2.5,
            "Рибне борошно": 1.0,
            "Кормові дріжджі": 0.7,
            "Трикальційфосфат": 0.5,
            "Dolfos D": 0.7,
            "Сіль": 0.05
        },
        prices: {},      // сюди ти вписуєш ціну за 1 кг по кожному компоненту
        totalKg: 25,    // сума кг рецепту
        totalCost: 0,   // загальна вартість партії
        costPerKg: 0    // собівартість 1 кг
    },

    eggs: {
        total: 0,
        bad: 0,
        own: 0,
        carry: 0,
        todayForSale: 0,
        totalForSale: 0,
        trays: 0,
        remainder: 0,
        trayPrice: 0,
        income: 0,
        hens1: 0,
        hens2: 0,
        hensTotal: 0,
        productivity: 0,
        reservedTrays: 0,
        freeTrays: 0
    },

    orders: [],
    clients: {},

    finance: {
        incomeToday: 0,
        feedCostToday: 0,
        profitToday: 0
    },

    incub: [],
    flock: {
        males: 0,
        females: 0,
        deaths: 0,
        avgAge: 0
    }
};