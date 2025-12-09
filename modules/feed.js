/* ============================================================
   FEED MODULE — комбікорм (FULL ENTERPRISE MODE)
   Відповідає за:
   - рецепт
   - розрахунок партії
   - добову норму
   - залишки компонентів
   - виробництво партії
   ============================================================ */

import { DATA, saveLocal, autosave } from "./core.js";
import { renderFeed } from "./ui.js";

/* ------------------------------------------------------------
   1. Розрахунок рецепту
------------------------------------------------------------ */

/* ============================================================
   FEED MODULE — рецепт комбікорму (FULL INTEGRATION)
============================================================ */

export function updateFeedRecipe() {

    const batch = Number(document.getElementById("feedBatchKg").value);

    // Твій точний рецепт (25 кг)
    const baseRecipe = {
        "Кукурудза": 10.0,
        "Пшениця": 5.0,
        "Ячмінь": 1.5,
        "Макуха соєва": 3.0,
        "Макуха соняшникова": 2.5,
        "Рибне борошно": 1.0,
        "Кормові дріжджі": 0.7,
        "Трикальційфосфат": 0.5,
        "Dolfos D": 0.7,
        "Сіль": 0.05
    };

    // Масштаб під нову вагу партії
    const k = batch / 25;

    let html = "";
    let totalKg = 0;
    let totalCost = 0;

    for (let comp in baseRecipe) {
        const kg = (baseRecipe[comp] * k).toFixed(3);
        totalKg += Number(kg);

        const priceInputId = `${comp}_price`;
        const price = Number(document.getElementById(priceInputId)?.value || 0);
        const sum = price * kg;
        totalCost += sum;

        html += `
        <tr>
            <td>${comp}</td>
            <td>${kg}</td>
            <td>
                <input type="number" id="${priceInputId}" value="${price}" 
                    oninput="updateFeedRecipe()" style="width:80px">
            </td>
            <td>${sum.toFixed(2)}</td>
        </tr>`;
    }

    document.getElementById("feedTableRows").innerHTML = html;
    document.getElementById("feedTotalKg").innerText = totalKg.toFixed(2);
    document.getElementById("feedTotalCost").innerText = totalCost.toFixed(2);
    document.getElementById("feedAvgCost").innerText = (totalCost / totalKg).toFixed(2);
}

/* ------------------- Оновлення ціни ------------------- */
export function updateFeedPrice(comp, val) {
    if (!DATA.feed.prices) DATA.feed.prices = {};
    DATA.feed.prices[comp] = Number(val);
    recalcFeed();
}

/* ------------------------------------------------------------
   Пресети рецептів
------------------------------------------------------------ */
export function applyRecipePreset(type) {
    if (type === "starter") {
        DATA.feed.recipe = {
            "Кукурудза": 45,
            "Пшениця": 20,
            "Макуха соєва": 18,
            "Макуха соняшникова": 7,
            "Рибне борошно": 5,
            "Дріжджі": 2,
            "Трикальційфосфат": 2,
            "Крейда": 1
        };
    }

    if (type === "grower") {
        DATA.feed.recipe = {
            "Кукурудза": 50,
            "Пшениця": 22,
            "Макуха соєва": 15,
            "Макуха соняшникова": 6,
            "Рибне борошно": 4,
            "Дріжджі": 2,
            "Трикальційфосфат": 1
        };
    }

    if (type === "layer") {
    // Рецепт на 25 кг
    DATA.feed.recipeKg = {
        "Кукурудза": 10.0,
        "Пшениця": 5.0,
        "Ячмінь": 1.5,
        "Соева макуха": 3.0,
        "Соняшникова макуха": 2.5,
        "Рибне борошно": 1.0,
        "Кормові дріжджі": 0.7,
        "Трикальційфосфат": 0.5,
        "Dolfos D": 0.7,
        "Сіль": 0.05
    };
    }

    recalcFeed();
}

/* ------------------------------------------------------------
   Ініціалізація модуля
------------------------------------------------------------ */
export function initFeedModule() {
    if (!DATA.feed) DATA.feed = {};
    if (!DATA.feed.recipe) applyRecipePreset("layer");

    recalcFeed();
}

/* === 1.1 Рецепт — рендер таблиці === */
if (DATA.feed.recipe && DATA.feed.components) {
    let html = "";
    let totalKg = 0;
    let totalCost = 0;

    for (let key in DATA.feed.recipe) {

        const percent = DATA.feed.recipe[key];
        const kg = DATA.feed.components[key] || 0;
        const price = DATA.feed.prices?.[key] || 0;
        const sum = kg * price;

        totalKg += kg;
        totalCost += sum;

        html += `
            <tr>
                <td>${key}</td>
                <td>${percent}%</td>
                <td>${kg.toFixed(2)}</td>
                <td>
                    <input type="number" 
                        value="${price}" 
                        onchange="updateFeedPrice('${key}', this.value)">
                </td>
                <td>${sum.toFixed(2)}</td>
            </tr>`;
    }

    setHTML("feedTableRows", html);
    setHTML("recipeTotalKg", totalKg.toFixed(2));
    setHTML("recipeTotalCost", totalCost.toFixed(2));
    setHTML("recipeCostPerKg", (totalCost / totalKg).toFixed(2));
}

/* ------------------------------------------------------------
   2. Пресети рецептів (стартер, гровер, несучки)
------------------------------------------------------------ */

export function applyRecipePreset(type) {
    if (type === "starter") {
        DATA.feed.recipe = {
            "Кукурудза": 45,
            "Пшениця": 20,
            "Макуха соєва": 18,
            "Макуха соняшникова": 7,
            "Рибне борошно": 5,
            "Дріжджі кормові": 2,
            "Трикальційфосфат": 2,
            "Крейда": 1
        };
    }

    if (type === "grower") {
        DATA.feed.recipe = {
            "Кукурудза": 50,
            "Пшениця": 22,
            "Макуха соєва": 15,
            "Макуха соняшникова": 6,
            "Рибне борошно": 4,
            "Дріжджі": 2,
            "Трикальційфосфат": 1
        };
    }

    if (type === "layer") {
        DATA.feed.recipe = {
            "Кукурудза": 55,
            "Пшениця": 25,
            "Макуха соєва": 10,
            "Макуха соняшникова": 5,
            "Дріжджі": 2,
            "Трикальційфосфат": 2,
            "Крейда": 1
        };
    }

    recalcFeed();
    autosave();
}

/* ------------------------------------------------------------
   3. Виробництво партії
------------------------------------------------------------ */

export function produceFeedBatch() {
    const size = Number(document.getElementById("feedBatchSize").value);
    DATA.feed.ready = (DATA.feed.ready || 0) + size;

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   4. Списання добової норми
------------------------------------------------------------ */

export function consumeDailyFeed() {
    if (!DATA.flock || !DATA.flock.females) DATA.flock = { females: 0 };

    const hens = Number(DATA.flock.females);
    const perHen = Number(DATA.feed.dailyPerHen || 0);

    const needKg = (hens * perHen) / 1000;

    DATA.feed.ready = (DATA.feed.ready || 0) - needKg;
    if (DATA.feed.ready < 0) DATA.feed.ready = 0;

    autosave();
    renderFeed();
}

/* ------------------------------------------------------------
   5. Оновлення таблиці запасів
------------------------------------------------------------ */

export function updateStockTable() {
    const recipe = DATA.feed.components || {};
    const stock = DATA.feed.stock || {};

    let rows = "";
    for (let key in recipe) {
        const need = recipe[key];
        const have = stock[key] || 0;

        let status = "";
        let color = "";

        if (have >= need) {
            status = "Достатньо";
            color = "buy-green";
        } else if (have >= need * 0.5) {
            status = "Мало";
            color = "buy-orange";
        } else {
            status = "Критично мало";
            color = "buy-red";
        }

        rows += `
        <tr class="${color}">
            <td>${key}</td>
            <td>${have.toFixed(2)}</td>
            <td>${need.toFixed(2)}</td>
            <td>${status}</td>
        </tr>`;
    }

    document.getElementById("stockRows").innerHTML = rows;
}

/* ------------------------------------------------------------
   6. Головна точка входу модуля
------------------------------------------------------------ */

export function initFeedModule() {
    document.getElementById("produceFeedBatch").onclick = produceFeedBatch;
    document.getElementById("consumeDailyFeed").onclick = consumeDailyFeed;

    recalcFeed();
}