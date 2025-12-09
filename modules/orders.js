/* ============================================================
   MODULE: orders.js
   FULL PRO MODE — Модуль керування замовленнями
   Відповідає за:
   • додавання замовлення
   • зміна статусу: активні → виконані
   • резервування лотків
   • автосинхронізацію
   • оновлення клієнтів та інтерфейсу
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { queueSync } from "../core/sync.js";
import { renderOrders } from "./render.js";
import { clientsAutoUpdate } from "./clients.js";

/* ------------------------------------------------------------
   1. Додати нове замовлення
------------------------------------------------------------ */

export function addOrder() {
    const name  = document.getElementById("ordName").value.trim();
    const eggs  = Number(document.getElementById("ordEggs").value);
    const trays = Number(document.getElementById("ordTrays").value);
    const date  = document.getElementById("ordDate").value;
    const note  = document.getElementById("ordNote").value.trim();

    if (!name || !trays || trays <= 0) {
        alert("Введи коректне ім’я та кількість лотків.");
        return;
    }

    const id = Date.now(); // унікальний ID

    const order = {
        id,
        name,
        eggs: eggs || trays * 20,
        trays,
        date: date || new Date().toISOString().split("T")[0],
        note,
        done: false
    };

    DATA.orders.push(order);

    // оновлюємо яйця (резерв лотків)
    DATA.eggs.reservedTrays = calculateReservedTrays();

    autosave();
    queueSync();
    clientsAutoUpdate();
    renderOrders();

    clearOrderForm();
}

function clearOrderForm() {
    document.getElementById("ordName").value = "";
    document.getElementById("ordEggs").value = "";
    document.getElementById("ordTrays").value = "";
    document.getElementById("ordDate").value = "";
    document.getElementById("ordNote").value = "";
}

/* ------------------------------------------------------------
   2. Завершити замовлення
------------------------------------------------------------ */

export function completeOrder(id) {
    const order = DATA.orders.find(o => o.id === id);
    if (!order) return;

    order.done = true;

    // Вільні лотки перераховуються
    DATA.eggs.reservedTrays = calculateReservedTrays();

    autosave();
    queueSync();
    clientsAutoUpdate();
    renderOrders();
}

/* ------------------------------------------------------------
   3. Допоміжна функція
   Підрахунок заброньованих лотків (active orders)
------------------------------------------------------------ */

export function calculateReservedTrays() {
    let reserved = 0;

    for (let o of DATA.orders) {
        if (!o.done) reserved += Number(o.trays);
    }

    // Також оновлюємо загальний баланс лотків
    const totalTrays = DATA.eggs.trays || 0;
    DATA.eggs.freeTrays = totalTrays - reserved;

    if (DATA.eggs.freeTrays < 0) DATA.eggs.freeTrays = 0;

    return reserved;
}

/* ------------------------------------------------------------
   4. Головна ініціалізація модуля
------------------------------------------------------------ */

export function initOrdersModule() {
    // після перезавантаження з памʼяті перерахуємо лотки
    DATA.eggs.reservedTrays = calculateReservedTrays();

    renderOrders();
}