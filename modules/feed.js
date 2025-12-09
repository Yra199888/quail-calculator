/* ============================================================
   MODULE: feed.js
   FULL ENTERPRISE MODE (C2)
   Рецепт → Кілограми → Ціна → Сума → Середня вартість 1 кг
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderFeed } from "./render.js";

/* ------------------------------------------------------------
   1. Ініціалізація рецепта (твій рецепт для несучок)
------------------------------------------------------------ */

DATA.feed = DATA.feed || {};
DATA.feed.recipe = DATA.feed.recipe || {
        "Кукурудза": 40,
        "Пшениця": 23,
        "Ячмінь": 10,
        "Макуха соєва": 8,
        "Макуха соняшникова": 7,
        "Дріжджі кормові": 3,
        "Трикальційфосфат": 2,
        "Крейда": 3,
        "Рибне борошно": 2,
        "Сіль": 1,
        "Премікс": 1
};

DATA.feed.prices = DATA.feed.prices || {};   // ціна за 1 кг компонентів
DATA.feed.components = DATA.feed.components || {}; // розрахунок у кг

export function applyRecipePreset(type) {
    if (type === "layer") {
        DATA.feed.recipe = { ...DEFAULT_LAYER_FEED };
    }

    recalcFeed();
    autosave();
}


/* ------------------------------------------------------------
   2. Головний перерахунок рецепта
------------------------------------------------------------ */

export function recalcFeed() {
    const batchKg = Number(document.getElementById("feedBatchKg").value);

    const recipe = DATA.feed.recipe;
    const prices = DATA.feed.prices;
    let rows = "";
    let totalKg = 0;
    let totalCost = 0;

    for (let comp in recipe) {
        const percent = recipe[comp];
        const kg = (batchKg * percent) / 100;
        const price = Number(prices[comp] || 0);
        const sum = kg * price;

        DATA.feed.components[comp] = kg;

        totalKg += kg;
        totalCost += sum;

        rows += `
            <tr>
                <td>${comp}</td>
                <td>${percent}%</td>
                <td><b>${kg.toFixed(2)}</b> кг</td>
                <td>
                    <input type="number" 
                           value="${price}" 
                           onchange="updateComponentPrice('${comp}', this.value)">
                </td>
                <td>${sum.toFixed(2)} грн</td>
            </tr>
        `;
    }

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.costPerKg = totalKg > 0 ? totalCost / totalKg : 0;

    document.getElementById("feedTableRows").innerHTML = rows;
    document.getElementById("feedTotalKg").textContent = totalKg.toFixed(2);
    document.getElementById("feedTotalCost").textContent = totalCost.toFixed(2);
    document.getElementById("feedCostPerKg").textContent = DATA.feed.costPerKg.toFixed(2);

    autosave();
    renderFeed();
}


/* ------------------------------------------------------------
   3. Оновлення ціни компоненту
------------------------------------------------------------ */

export function updateComponentPrice(name, value) {
    DATA.feed.prices[name] = Number(value);
    recalcFeed();
}


/* ------------------------------------------------------------
   4. Виготовлення партії комбікорму
------------------------------------------------------------ */

export function produceFeedBatch() {
    const batch = Number(document.getElementById("feedBatchKg").value);

    DATA.feed.ready = (DATA.feed.ready || 0) + batch;
    autosave();
    renderFeed();
}


/* ------------------------------------------------------------
   5. Списання добової норми
------------------------------------------------------------ */

export function consumeDailyFeed() {
    const hens = Number(DATA.flock?.females || 0);
    const perHen = Number(document.getElementById("feedDailyPerHen").value); // г/день

    const needKg = (hens * perHen) / 1000;

    DATA.feed.ready = Math.max(0, (DATA.feed.ready || 0) - needKg);

    autosave();
    renderFeed();
}


/* ------------------------------------------------------------
   6. Ініціалізація модуля
------------------------------------------------------------ */

export function initFeedModule() {
    document.getElementById("feedBatchKg").oninput = recalcFeed;

    document.getElementById("produceFeedBtn").onclick = produceFeedBatch;
    document.getElementById("consumeDailyBtn").onclick = consumeDailyFeed;

    recalcFeed();
}