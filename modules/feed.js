/* ============================================================
   MODULE: feed.js — Комбікорм (PRO MODE)
   Підтримує:
   - Рецепт (твої відсотки)
   - Розрахунок кг
   - Ціна за кг для кожного компонента
   - Загальна вартість партії
   - Середня ціна 1 кг
   - Залишок готового корму
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderFeed } from "./render.js";

/* ------------------------------------------------------------
   1. РЕЦЕПТ ЗА ЗАМОВЧУВАННЯМ (ТВОЯ СУМІШ)
------------------------------------------------------------ */

DATA.feed.recipe = {
    "Кукурудза": 55,
    "Пшениця": 20,
    "Ячмінь": 5,
    "Макуха соєва": 10,
    "Макуха соняшникова": 5,
    "Трикальційфосфат": 2,
    "Долфос D": 2,
    "Дріжджі кормові": 1
};

/* ------------------------------------------------------------
   2. РОЗРАХУНОК РЕЦЕПТА
------------------------------------------------------------ */

export function recalcFeed() {
    const target = Number(document.getElementById("targetKg").value || 0);
    const rows = [];
    let totalCost = 0;
    let totalKg = 0;

    DATA.feed.components = {};

    for (let key in DATA.feed.recipe) {
        const percent = DATA.feed.recipe[key];
        const kg = (target * percent) / 100;

        const priceInput = document.getElementById(`price_${key}`);
        const price = Number(priceInput?.value || 0);

        const cost = kg * price;

        DATA.feed.components[key] = {
            percent,
            kg,
            price,
            cost
        };

        totalKg += kg;
        totalCost += cost;

        rows.push(`
            <tr>
                <td>${key}</td>
                <td>${percent}%</td>
                <td>${kg.toFixed(2)}</td>
                <td><input id="price_${key}" type="number" value="${price}" 
                       oninput="import('/modules/feed.js').then(m=>m.recalcFeed())"></td>
                <td>${cost.toFixed(2)}</td>
            </tr>
        `);
    }

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.avgCost = totalKg > 0 ? totalCost / totalKg : 0;

    document.getElementById("feedRows").innerHTML = rows.join("");

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   3. ВИГОТОВЛЕННЯ ПАРТІЇ
------------------------------------------------------------ */
export function makeFeedBatch() {
    const size = Number(document.getElementById("batchSizeInput").value || 0);

    DATA.feed.ready = (DATA.feed.ready || 0) + size;

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   4. СПИСАННЯ ДОБОВОЇ НОРМИ
------------------------------------------------------------ */
export function consumeDailyFeed() {
    const hens = Number(DATA.flock?.females || 0);
    const norm = Number(document.getElementById("dailyNormInput").value || DATA.feed.dailyNorm || 30);

    const needKg = (hens * norm) / 1000;

    DATA.feed.ready = Math.max(0, (DATA.feed.ready || 0) - needKg);

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   5. ІНІЦІАЛІЗАЦІЯ МОДУЛЯ
------------------------------------------------------------ */
export function initFeedModule() {
    document.getElementById("makeFeedBtn").onclick = makeFeedBatch;
    document.getElementById("consumeDailyBtn").onclick = consumeDailyFeed;

    recalcFeed();
}