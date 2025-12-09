/* ============================================================
   MODULE: eggs.js — Облік яєць (FULL ENTERPRISE MODE)

   Відповідає за:
   - щоденний облік яєць
   - залишки
   - кількість лотків
   - продуктивність 1-ї та 2-ї партії
   - підсумкова аналітика
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderEggs } from "./render.js";

/* ------------------------------------------------------------
   1. Основна функція перерахунку балансу яєць
------------------------------------------------------------ */

export function recalcEggsBalance() {
    const total = Number(document.getElementById("eggsTotal").value) || 0;
    const bad = Number(document.getElementById("eggsBad").value) || 0;
    const own = Number(document.getElementById("eggsOwn").value) || 0;
    const carry = Number(document.getElementById("eggsCarry").value) || 0;

    const trayPrice = Number(document.getElementById("trayPrice").value) || 0;

    // Яйця для продажу за сьогодні
    const todayForSale = Math.max(total - bad - own, 0);

    // Загальний залишок яєць (включає вчора + сьогодні)
    const totalForSale = todayForSale + carry;

    // Лотків (20 яєць)
    const trays = Math.floor(totalForSale / 20);

    // Залишок після заповнення лотків
    const remainder = totalForSale % 20;

    DATA.eggs = DATA.eggs || {};
    DATA.eggs.total = total;
    DATA.eggs.bad = bad;
    DATA.eggs.own = own;
    DATA.eggs.carry = carry;

    DATA.eggs.todayForSale = todayForSale;
    DATA.eggs.totalForSale = totalForSale;
    DATA.eggs.trays = trays;
    DATA.eggs.remainder = remainder;

    DATA.eggs.trayPrice = trayPrice;
    DATA.eggs.income = trays * trayPrice;

    // Важливо — передаємо в orders.js інформацію про доступні лотки
    DATA.eggs.freeTrays = trays - (DATA.eggs.reservedTrays || 0);

    autosave();
    renderEggs();
}

/* ------------------------------------------------------------
   2. Розрахунок продуктивності
------------------------------------------------------------ */

export function recalcProductivity() {
    const hens1 = Number(document.getElementById("hens1").value) || 0;
    const hens2 = Number(document.getElementById("hens2").value) || 0;

    const hensTotal = hens1 + hens2;

    const totalEggs = Number(document.getElementById("eggsTotal").value) || 0;

    const productivity =
        hensTotal > 0 ? (totalEggs / hensTotal) * 100 : 0;

    DATA.eggs = DATA.eggs || {};
    DATA.eggs.hens1 = hens1;
    DATA.eggs.hens2 = hens2;
    DATA.eggs.hensTotal = hensTotal;
    DATA.eggs.productivity = productivity;

    autosave();
    renderEggs();
}

/* ------------------------------------------------------------
   3. Оновлення резервів лотків після замовлень
------------------------------------------------------------ */

export function updateTrayReservation(reserved) {
    DATA.eggs = DATA.eggs || {};
    DATA.eggs.reservedTrays = reserved;

    // Перераховуємо вільні лотки
    const trays = DATA.eggs.trays || 0;
    DATA.eggs.freeTrays = trays - reserved;

    autosave();
    renderEggs();
}

/* ------------------------------------------------------------
   4. Ініціалізація модуля
      — викликається з app.js після завантаження сторінки
------------------------------------------------------------ */

export function initEggsModule() {
    recalcEggsBalance();
    recalcProductivity();
}