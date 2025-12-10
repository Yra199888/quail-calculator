// ============================================================
// FEED MODULE — РЕЦЕПТ КОМБІКОРМУ (PRO MODE)
// ============================================================

import { DATA, autosave } from "../core/data.js";
import { renderAll } from "./render.js";

// ------------------------------------------------------------
// 1. Твій постійний рецепт (зафіксований)
// ------------------------------------------------------------

DATA.feed.recipe = {
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
};

// ------------------------------------------------------------
// 2. Рендер таблиці рецепту
// ------------------------------------------------------------

export function renderFeedRecipe() {
    const tbody = document.getElementById("feedRecipeTable");
    if (!tbody) return;

    let html = "";
    let totalCost = 0;
    let totalKg = 0;

    for (let comp in DATA.feed.recipe) {
        const kg = DATA.feed.recipe[comp];
        totalKg += kg;

        const price = Number(DATA.feed.prices?.[comp] || 0);
        const sum = kg * price;
        totalCost += sum;

        html += `
        <tr>
            <td>${comp}</td>
            <td>${kg.toFixed(2)}</td>
            <td>
                <input type="number" step="0.01"
                       oninput="updateFeedPrice('${comp}', this.value)"
                       value="${price}">
            </td>
            <td>${sum.toFixed(2)}</td>
        </tr>`;
    }

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.costPerKg = totalKg > 0 ? totalCost / totalKg : 0;

    tbody.innerHTML = html;

    document.getElementById("feedTotalWeight").innerText = totalKg.toFixed(2);
    document.getElementById("feedCostPerKg").innerText = DATA.feed.costPerKg.toFixed(2);
    document.getElementById("feedTotalCost").innerText = totalCost.toFixed(2);

    autosave();
}

// ------------------------------------------------------------
// 3. Зміна ціни
// ------------------------------------------------------------

window.updateFeedPrice = function (comp, price) {
    if (!DATA.feed.prices) DATA.feed.prices = {};
    DATA.feed.prices[comp] = Number(price);

    renderFeedRecipe();
    autosave();
};

// ------------------------------------------------------------
// 4. Ініціалізація модуля
// ------------------------------------------------------------

export function initFeedModule() {
    renderFeedRecipe();
}