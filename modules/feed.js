/* ============================================================
   MODULE: feed.js — FULL ENTERPRISE MODE
   Комбікорм:
   - рецепт
   - розрахунок кг
   - розрахунок вартості
   - середня ціна за 1 кг
   - виробництво партії
   - списання добової норми
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderFeed } from "./render.js";

/* ------------------------------------------------------------
   1. Стартовий рецепт (твій фінальний)
------------------------------------------------------------ */

DATA.feed = DATA.feed || {};
DATA.feed.recipe = {
    "Кукурудза": 10,
    "Пшениця": 5,
    "Ячмінь": 1.5,
    "Макуха соєва": 3,
    "Макуха соняшникова": 2.5,
    "Рибне борошно": 1,
    "Дріжджі кормові": 0.7,
    "Трикальційфосфат": 0.5,
    "Dolfos D": 0.7,
    "Сіль": 0.05
};

/* ------------------------------------------------------------
   2. Розрахунок рецепту
------------------------------------------------------------ */

export function recalcFeedRecipe() {
    const rows = document.getElementById("feedRecipeRows");
    const costRow = document.getElementById("feedCostRows");
    const avgCostEl = document.getElementById("avgCostKg");

    if (!rows || !costRow) return;

    let totalKg = 0;
    let totalCost = 0;

    let htmlRecipe = "";
    let htmlCost = "";

    for (let name in DATA.feed.recipe) {
        const kg = Number(DATA.feed.recipe[name]);
        const price = Number(DATA.feed.prices?.[name] || 0);
        const sum = kg * price;

        totalKg += kg;
        totalCost += sum;

        htmlRecipe += `
            <tr>
                <td>${name}</td>
                <td><input type="number" value="${kg}" step="0.01"
                    onchange="updateRecipeValue('${name}', this.value)"></td>
            </tr>
        `;

        htmlCost += `
            <tr>
                <td>${name}</td>
                <td>${kg} кг</td>
                <td><input type="number" value="${price}" step="0.01"
                    onchange="updatePrice('${name}', this.value)"></td>
                <td>${sum.toFixed(2)} грн</td>
            </tr>
        `;
    }

    rows.innerHTML = htmlRecipe;
    costRow.innerHTML = htmlCost;

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.costPerKg = totalCost / totalKg;

    avgCostEl.innerHTML = DATA.feed.costPerKg.toFixed(2);

    autosave();
    renderFeed();
}

window.updateRecipeValue = function (name, value) {
    DATA.feed.recipe[name] = Number(value);
    recalcFeedRecipe();
};

window.updatePrice = function (name, val) {
    if (!DATA.feed.prices) DATA.feed.prices = {};
    DATA.feed.prices[name] = Number(val);
    recalcFeedRecipe();
};

/* ------------------------------------------------------------
   3. Виробництво партії
------------------------------------------------------------ */

export function makeFeedBatch() {
    const size = Number(document.getElementById("batchKg").value);

    DATA.feed.ready = (DATA.feed.ready || 0) + size;

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   4. Добова норма (списання)
------------------------------------------------------------ */

export function consumeDailyFeed() {
    const hens = Number(DATA.flock?.females || 0);
    const perHen = Number(DATA.feed.dailyPerHen || 30);

    const needKg = hens * perHen / 1000;

    DATA.feed.ready = Math.max(0, (DATA.feed.ready || 0) - needKg);

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   5. Ініціалізація блоку комбікорму
------------------------------------------------------------ */

export function initFeedModule() {
    // кнопки
    document.getElementById("btnMakeFeed").onclick = makeFeedBatch;
    document.getElementById("btnConsumeDaily").onclick = consumeDailyFeed;

    // розрахунок рецепту
    recalcFeedRecipe();
}