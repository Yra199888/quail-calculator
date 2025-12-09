/* ============================================================
   MODULE: flock.js
   Відповідає за:
   - Поголів’я (самці, самки, смертність, середній вік)
   - Оновлення даних
   - Рендер секції
   - Автозбереження
============================================================ */

/* ------------------------------------------------------------
   1. Оновлення даних поголів’я
------------------------------------------------------------ */

function updateFlock() {
    DATA.flock = {
        males: Number(document.getElementById("males")?.value || 0),
        females: Number(document.getElementById("females")?.value || 0),
        deaths: Number(document.getElementById("deaths")?.value || 0),
        avgAge: Number(document.getElementById("avgAge")?.value || 0)
    };

    autosave();
    renderFlock();
}


/* ------------------------------------------------------------
   2. Розрахунок загальної кількості
------------------------------------------------------------ */

function calcFlockTotal() {
    const f = DATA.flock || {};
    const total = (f.males || 0) + (f.females || 0) - (f.deaths || 0);
    return total < 0 ? 0 : total;
}


/* ------------------------------------------------------------
   3. Рендер секції "Поголів’я"
------------------------------------------------------------ */

function renderFlock() {
    const f = DATA.flock || {};
    const total = calcFlockTotal();

    // Показуємо у HTML
    const elTotal = document.getElementById("flockTotal");
    if (elTotal) elTotal.textContent = total;

    // Відтворюємо значення у полях (на випадок відновлення)
    if (document.getElementById("males")) 
        document.getElementById("males").value = f.males || 0;

    if (document.getElementById("females"))
        document.getElementById("females").value = f.females || 0;

    if (document.getElementById("deaths"))
        document.getElementById("deaths").value = f.deaths || 0;

    if (document.getElementById("avgAge"))
        document.getElementById("avgAge").value = f.avgAge || 0;
}


/* ------------------------------------------------------------
   4. Підписка на події input
------------------------------------------------------------ */

function initFlockModule() {
    const ids = ["males", "females", "deaths", "avgAge"];

    for (let id of ids) {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateFlock);
    }

    renderFlock();
}

initFlockModule();