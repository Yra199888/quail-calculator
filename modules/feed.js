/* ============================================================
   MODULE: feed.js
   FULL ENTERPRISE MODE (C2)
   Рецепт → Кілограми → Ціна → Сума → Середня вартість 1 кг
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderFeed } from "./render.js";

/* ============================================================
   РЕЦЕПТ КОРМУ ДЛЯ НЕСУЧОК (фіксований рецепт користувача)
============================================================ */

export const FEED_RECIPE = {
    "Кукурудза": 10.0,
    "Пшениця": 5.0,
    "Ячмінь": 1.5,
    "Макуха соєва": 3.0,
    "Макуха соняшникова": 2.5,
    "Рибне борошно": 1.0,
    "Дріжджі кормові": 0.7,
    "Трикальційфосфат": 0.5,
    "Dolfos D": 0.7,
    "Сіль": 0.05
};


/* ============================================================
   1. Відображення рецепта у таблиці
============================================================ */

export function renderFeedRecipe() {
    let html = "";

    for (let key in FEED_RECIPE) {
        const kg = FEED_RECIPE[key];

        const price = DATA.feed.prices?.[key] || 0;
        const cost = price * kg;

        html += `
        <tr>
            <td>${key}</td>
            <td>${kg.toFixed(2)}</td>
            <td>
                <input type="number" 
                       value="${price}" 
                       oninput="updateFeedPrice('${key}', this.value)">
            </td>
            <td>${cost.toFixed(2)}</td>
        </tr>
        `;
    }

    document.getElementById("feedRecipeRows").innerHTML = html;

    recalcFeedRecipe();
}


/* ============================================================
   2. Оновлення ціни компоненту
============================================================ */

export function updateFeedPrice(name, value) {
    if (!DATA.feed.prices) DATA.feed.prices = {};
    DATA.feed.prices[name] = Number(value);
    recalcFeedRecipe();
}


/* ============================================================
   3. Перерахунок собівартості партії
============================================================ */

export function recalcFeedRecipe() {
    let totalCost = 0;
    let totalKg = 0;

    for (let key in FEED_RECIPE) {
        const kg = FEED_RECIPE[key];
        const price = DATA.feed.prices?.[key] || 0;
        const cost = price * kg;

        totalCost += cost;
        totalKg += kg;
    }

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.costPerKg = totalCost / totalKg;

    document.getElementById("feedTotalKg").innerText = totalKg.toFixed(2);
    document.getElementById("feedTotalCost").innerText = totalCost.toFixed(2);
    document.getElementById("feedCostPerKg").innerText = DATA.feed.costPerKg.toFixed(2);

    autosave();
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