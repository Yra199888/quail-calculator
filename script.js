// ============================
//  ЯЙЦЯ — БЕЗ ЛОМАННЯ СКЛАДУ
// ============================

let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");
let eggsCarry = JSON.parse(localStorage.getItem("eggsCarry") || "{carry:0,totalTrays:0}");

function recomputeEggs() {
    const dates = Object.keys(eggs).sort();
    let carry = 0;
    let totalTrays = 0;

    dates.forEach(d => {
        const e = eggs[d];
        const commercial = Math.max(
            (Number(e.good) || 0) -
            (Number(e.bad) || 0) -
            (Number(e.home) || 0),
            0
        );

        const sum = carry + commercial;
        const trays = Math.floor(sum / 20);
        const remainder = sum % 20;

        e.commercial = commercial;
        e.sum = sum;
        e.trays = trays;
        e.remainder = remainder;
        e.carryIn = carry;

        carry = remainder;
        totalTrays += trays;
    });

    eggsCarry.carry = carry;
    eggsCarry.totalTrays = totalTrays;

    localStorage.setItem("eggs", JSON.stringify(eggs));
    localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));
}

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0,10);

    eggs[date] = {
        good: Number(eggsGood.value) || 0,
        bad: Number(eggsBad.value) || 0,
        home: Number(eggsHome.value) || 0
    };

    recomputeEggs();
    renderEggsReport();

    const e = eggs[date];
    eggsInfo.innerHTML =
        e.sum < 20
            ? `🥚 ${e.sum} яєць (до лотка бракує ${20 - e.sum})`
            : `📦 Лотки: <b>${e.trays}</b>, залишок <b>${e.remainder}</b>`;
}

window.saveEggRecord = saveEggRecord;

// ============================
//  СИНХРОНІЗАЦІЯ ЗІ СКЛАДОМ
// ============================
function syncEggsToWarehouse() {
    const produced = eggsCarry.totalTrays || 0;
    const current = warehouse.ready || 0;

    const delta = produced - current;
    if (delta > 0) {
        warehouse.ready += delta;
        saveWarehouse();
        renderWarehouse();
        alert(`✅ Додано ${delta} лотків на склад`);
    } else {
        alert("ℹ️ Склад уже синхронізований");
    }
}

window.syncEggsToWarehouse = syncEggsToWarehouse;

// ============================
//  ЗВІТ
// ============================
function renderEggsReport() {
    const list = document.getElementById("eggsList");
    if (!list) return;

    const dates = Object.keys(eggs).sort().reverse();
    if (!dates.length) {
        list.innerHTML = "<i>Записів немає</i>";
        return;
    }

    list.innerHTML = dates.map(d => {
        const e = eggs[d];
        return `
        <div class="egg-entry">
            <b>${d}</b><br>
            Комерційні: ${e.commercial}<br>
            Перенос: ${e.carryIn} → Разом: ${e.sum}<br>
            Лотки: <b>${e.trays}</b> | Залишок: <b>${e.remainder}</b>
        </div>`;
    }).join("");
}

recomputeEggs();
renderEggsReport();