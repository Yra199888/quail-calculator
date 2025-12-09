/* ============================================================
   MODULE: flock.js
   Відповідає за:
   - Облік поголів’я
   - Самці, самки, смертність, середній вік
   - Автоматичний перерахунок
   - Оновлення DATA.flock
   - Рендер секції "Поголів’я"
=============================================================== */

/* ------------------------------------------------------------
   1. Оновлення значень поголів’я
------------------------------------------------------------ */

function updateFlock() {
    const males = Number(document.getElementById("males")?.value || 0);
    const females = Number(document.getElementById("females")?.value || 0);
    const deaths = Number(document.getElementById("deaths")?.value || 0);
    const avgAge = Number(document.getElementById("avgAge")?.value || 0);

    DATA.flock = {
        males,
        females,
        deaths,
        avgAge,
        total: males + females - deaths
    };

    autosave();
    renderFlock();
}


/* ------------------------------------------------------------
   2. Рендер секції "Поголів’я"
------------------------------------------------------------ */

function renderFlock() {
    if (!DATA.flock) return;

    const t = DATA.flock.total || 0;
    const el = document.getElementById("flockTotal");

    if (el) el.textContent = t;
}


/* ------------------------------------------------------------
   3. Ініціалізація (події input)
------------------------------------------------------------ */

function initFlockModule() {
    const ids = ["males", "females", "deaths", "avgAge"];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateFlock);
    });

    renderFlock();
}

/* Викликається у modules/render.js → initAllModules() */