/* ============================================================
   MODULE: graphs.js
   Відповідає за:
   - Побудову графіків яйценосності
   - Графік виручки
   - Автоматичне оновлення після змін у eggs.js та finance.js
   - Збереження історії у DATA.graphs.history
============================================================ */

/* ------------------------------------------------------------
   0. Підготовка структури історії
------------------------------------------------------------ */

if (!DATA.graphs) DATA.graphs = {};
if (!DATA.graphs.history) DATA.graphs.history = [];   // масив: [{date, eggs, trays, income}]

/* ------------------------------------------------------------
   1. Запис щоденної статистики
------------------------------------------------------------ */

function graphsRecordDaily() {
    const today = new Date().toISOString().slice(0, 10);

    const eggs = Number(DATA.eggs?.lastTotal || 0);
    const trays = Number(DATA.eggs?.lastTrays || 0);
    const income = Number(DATA.eggs?.lastIncome || 0);

    // Якщо за сьогодні запис вже є → оновлюємо
    const exists = DATA.graphs.history.find(r => r.date === today);
    if (exists) {
        exists.eggs = eggs;
        exists.trays = trays;
        exists.income = income;
    } else {
        DATA.graphs.history.push({
            date: today,
            eggs,
            trays,
            income
        });
    }

    autosave();
}

/* ------------------------------------------------------------
   2. Побудова графіку яйценосності
------------------------------------------------------------ */

let chartEggsObj = null;

function renderChartEggs() {
    const ctx = document.getElementById("chartEggs");
    if (!ctx) return;

    const labels = DATA.graphs.history.map(h => h.date);
    const values = DATA.graphs.history.map(h => h.eggs);

    if (chartEggsObj) chartEggsObj.destroy();

    chartEggsObj = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Кількість яєць",
                data: values,
                borderColor: "#2d6a1f",
                backgroundColor: "rgba(45,106,31,0.3)",
                borderWidth: 3,
                tension: 0.4   // красиві криві лінії
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* ------------------------------------------------------------
   3. Побудова графіку доходу
------------------------------------------------------------ */

let chartIncomeObj = null;

function renderChartIncome() {
    const ctx = document.getElementById("chartIncome");
    if (!ctx) return;

    const labels = DATA.graphs.history.map(h => h.date);
    const values = DATA.graphs.history.map(h => h.income);

    if (chartIncomeObj) chartIncomeObj.destroy();

    chartIncomeObj = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Доход, грн",
                data: values,
                backgroundColor: "rgba(90,150,40,0.6)"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* ------------------------------------------------------------
   4. Глобальний рендер графіків
------------------------------------------------------------ */

function renderGraphs() {
    renderChartEggs();
    renderChartIncome();
}

/* ------------------------------------------------------------
   5. Auto-hook: викликаємо графіки при оновленні яєць / фінансів
------------------------------------------------------------ */

// Викликатиметься з eggs.js
function graphsFromEggsUpdate(eggsToday, traysToday, incomeToday) {
    DATA.eggs.lastTotal = eggsToday;
    DATA.eggs.lastTrays = traysToday;
    DATA.eggs.lastIncome = incomeToday;

    graphsRecordDaily();
    renderGraphs();
}

// Викликатиметься з finance.js
function graphsFromFinanceUpdate() {
    graphsRecordDaily();
    renderGraphs();
}

/* ------------------------------------------------------------
   6. Ініціалізація при запуску
------------------------------------------------------------ */

setTimeout(() => {
    renderGraphs();
}, 300);