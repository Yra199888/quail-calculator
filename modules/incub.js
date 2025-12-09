/* ============================================================
   MODULE: incub.js — Інкубація (FULL ENTERPRISE MODE)
   Відповідає за:
   - створення нової партії
   - розрахунок днів
   - оновлення статусу (активні / овоскопія / виведення / завершені)
   - ведення статистики
   - рендер таблиці
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderAll } from "./render.js";

/* ------------------------------------------------------------
   1. ДОДАТИ НОВУ ПАРТІЮ
------------------------------------------------------------ */

export function addIncubation() {

    const name = document.getElementById("incBatchName").value.trim();
    const start = document.getElementById("incStartDate").value;
    const eggs = Number(document.getElementById("incEggsSet").value);
    const note  = document.getElementById("incNote").value.trim();

    if (!name || !start || eggs <= 0) {
        alert("Заповни всі поля!");
        return;
    }

    const id = Date.now();

    DATA.incub.push({
        id,
        name,
        start,
        eggs,
        infertile: 0,
        hatched: 0,
        diedInc: 0,
        diedBrooder: 0,
        note,
        status: "active"
    });

    autosave();
    renderInc();
    renderAll();

    document.getElementById("incBatchName").value = "";
    document.getElementById("incEggsSet").value = "";
    document.getElementById("incNote").value = "";
}

/* ------------------------------------------------------------
   2. ФІЛЬТР (active / done / candling / hatch / all)
------------------------------------------------------------ */

function filterIncubation(list) {
    const filter = document.getElementById("incFilter").value;

    if (filter === "all") return list;
    return list.filter(i => i.status === filter);
}

/* ------------------------------------------------------------
   3. РОЗРАХУНОК КІЛЬКОСТІ ДНІВ
------------------------------------------------------------ */

function calcDays(startDate) {
    const d1 = new Date(startDate);
    const d2 = new Date();
    const diff = Math.floor((d2 - d1) / 86400000);
    return diff;
}

/* ------------------------------------------------------------
   4. ОНОВИТИ СТАТУС ПАРТІЇ
------------------------------------------------------------ */

export function updateIncStatus(id, field, value) {
    const item = DATA.incub.find(x => x.id === id);
    if (!item) return;

    item[field] = value;

    autosave();
    renderInc();
    renderAll();
}

/* ------------------------------------------------------------
   5. РЕНДЕР СПИСКУ ПАРТІЙ
------------------------------------------------------------ */

export function renderInc() {
    const body = document.getElementById("incubationBody");
    if (!body) return;

    // Порахувати дні для всіх партій
    DATA.incub.forEach(inc => {
        inc.days = calcDays(inc.start);

        // Автоматична зміна статусу за днями
        if (inc.days >= 6 && inc.days < 14) inc.status = "candling"; // овоскопія
        if (inc.days >= 15 && inc.days < 18) inc.status = "hatch";   // виведення
        if (inc.days >= 19) inc.status = "done";                     // завершені
    });

    const list = filterIncubation(DATA.incub);

    let html = "";
    for (let inc of list) {
        const alive =
            inc.eggs -
            inc.infertile -
            inc.diedInc -
            inc.diedBrooder -
            inc.hatched;

        html += `
        <tr>
            <td>${inc.name}</td>
            <td>${inc.start}</td>
            <td>${inc.days}</td>
            <td>${inc.eggs}</td>

            <td><input type="number" value="${inc.infertile}" onchange="updateIncStatus(${inc.id}, 'infertile', this.value)"></td>
            <td><input type="number" value="${inc.hatched}" onchange="updateIncStatus(${inc.id}, 'hatched', this.value)"></td>
            <td><input type="number" value="${inc.diedInc}" onchange="updateIncStatus(${inc.id}, 'diedInc', this.value)"></td>
            <td><input type="number" value="${inc.diedBrooder}" onchange="updateIncStatus(${inc.id}, 'diedBrooder', this.value)"></td>

            <td>${alive}</td>
            <td>${inc.status}</td>
            <td>${inc.note || ""}</td>
            <td><button onclick="deleteInc(${inc.id})">🗑</button></td>
        </tr>
        `;
    }

    body.innerHTML = html;
}

/* ------------------------------------------------------------
   6. ВИДАЛЕННЯ ПАРТІЇ
------------------------------------------------------------ */

export function deleteInc(id) {
    DATA.incub = DATA.incub.filter(x => x.id !== id);
    autosave();
    renderInc();
    renderAll();
}

/* ------------------------------------------------------------
   7. ІНІЦІАЛІЗАЦІЯ МОДУЛЯ
------------------------------------------------------------ */

export function initIncubModule() {
    document.getElementById("addIncubation").onclick = addIncubation;
    renderInc();
}