// ============================================================
// FEED MODULE — комбікорм (твій постійний рецепт)
// Рахує:
//  - кг по кожному компоненту
//  - суму по компоненту (кг × ціна за кг)
//  - загальну вагу партії
//  - загальну вартість партії
//  - собівартість 1 кг
// Дані зберігаються в DATA.feed і в localStorage (через autosave).
// ============================================================

// Глобальний об'єкт даних
window.DATA = window.DATA || {};
DATA.feed = DATA.feed || {};

// --- базовий рецепт на 25 кг (ТВІЙ РЕЦЕПТ, ЗАПАМ'ЯТАНИЙ) ---
DATA.feed.baseBatchKg = DATA.feed.baseBatchKg || 25;
DATA.feed.baseRecipe = DATA.feed.baseRecipe || {
    "Кукурудза":          10.0,
    "Пшениця":            5.0,
    "Ячмінь":             1.5,
    "Соєва макуха":       3.0,
    "Соняшникова макуха": 2.5,
    "Рибне борошно":      1.0,
    "Кормові дріжджі":    0.7,
    "Трикальційфосфат":   0.5,
    "Dolfos D":           0.7,
    "Сіль":               0.05
};

// ціни за кг по компонентах
DATA.feed.prices = DATA.feed.prices || {};

// поточна вага партії
DATA.feed.batchKg = DATA.feed.batchKg || 25;

// результат останнього розрахунку
DATA.feed.lastTotalKg   = DATA.feed.lastTotalKg   || 0;
DATA.feed.lastTotalCost = DATA.feed.lastTotalCost || 0;
DATA.feed.costPerKg     = DATA.feed.costPerKg     || 0;


// ------------------------------------------------------------
// Утиліта: нормалізувати назву в id
// ------------------------------------------------------------
function feedSlug(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_а-яіїєґ]/gi, "");
}


// ------------------------------------------------------------
// ГОЛОВНИЙ РОЗРАХУНОК РЕЦЕПТУ
// ------------------------------------------------------------
function recalcFeedRecipe() {
    const batchInput = document.getElementById("feedBatchKg");
    const tbody      = document.getElementById("feedRecipeBody");
    const totalKgEl  = document.getElementById("feedBatchTotalKg");
    const totalCostEl= document.getElementById("feedTotalCost");
    const costPerKgEl= document.getElementById("feedCostPerKg");

    if (!tbody) return; // ще не завантажився DOM

    // читаємо бажану вагу партії
    let batchKg = 25;
    if (batchInput) {
        batchKg = Number(batchInput.value);
        if (isNaN(batchKg) || batchKg <= 0) batchKg = 25;
        DATA.feed.batchKg = batchKg;
    }

    const baseBatch = DATA.feed.baseBatchKg || 25;
    const baseRecipe = DATA.feed.baseRecipe || {};
    const prices = DATA.feed.prices || {};

    const scale = baseBatch > 0 ? batchKg / baseBatch : 0;

    // перед перерендером — зчитуємо поточні ціни з інпутів
    for (const name of Object.keys(baseRecipe)) {
        const slug = feedSlug(name);
        const el = document.getElementById("price_" + slug);
        if (el) {
            const v = Number(el.value);
            prices[name] = isNaN(v) ? 0 : v;
        }
    }
    DATA.feed.prices = prices;

    let rowsHtml   = "";
    let totalKg    = 0;
    let totalCost  = 0;

    for (const [name, baseKg] of Object.entries(baseRecipe)) {
        const kg = +(baseKg * scale).toFixed(3);
        totalKg += kg;

        const price = prices[name] || 0;
        const sum   = +(kg * price).toFixed(2);
        totalCost  += sum;

        const slug = feedSlug(name);

        rowsHtml += `
            <tr>
                <td>${name}</td>
                <td>${kg.toFixed(3)}</td>
                <td>
                    <input type="number"
                           id="price_${slug}"
                           value="${price}"
                           min="0"
                           step="0.01"
                           oninput="recalcFeedRecipe()">
                </td>
                <td>${sum.toFixed(2)}</td>
            </tr>
        `;
    }

    tbody.innerHTML = rowsHtml;

    if (totalKgEl)   totalKgEl.textContent   = totalKg.toFixed(3);
    if (totalCostEl) totalCostEl.textContent = totalCost.toFixed(2);
    if (costPerKgEl) {
        const perKg = totalKg > 0 ? totalCost / totalKg : 0;
        costPerKgEl.textContent = perKg.toFixed(2);
    }

    // зберігаємо в DATA
    DATA.feed.lastTotalKg   = totalKg;
    DATA.feed.lastTotalCost = totalCost;
    DATA.feed.costPerKg     = totalKg > 0 ? totalCost / totalKg : 0;

    // autosave, якщо є
    if (typeof autosave === "function") {
        autosave();
    } else if (typeof saveData === "function") {
        saveData();
    }
}


// ------------------------------------------------------------
// ІНІЦІАЛІЗАЦІЯ МОДУЛЯ
// ------------------------------------------------------------
function initFeedModule() {
    // виставляємо останню вагу партії в інпут
    const batchInput = document.getElementById("feedBatchKg");
    if (batchInput) {
        batchInput.value = DATA.feed.batchKg || 25;
    }

    recalcFeedRecipe();
}

// запускаємо, коли DOM готовий
document.addEventListener("DOMContentLoaded", initFeedModule);