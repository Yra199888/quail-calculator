/**
 * warehouse.service.js
 * ---------------------------------------
 * Бізнес-логіка складу (БЕЗ DOM / БЕЗ HTML):
 *  - залишки кормових компонентів
 *  - порожні лотки
 *  - резерв лотків
 *  - мінімальні залишки
 */

import { AppState } from "../state/AppState.js";

/* =========================
   🧾 LOG HELPER
   ========================= */
function addLog(entry) {
  if (!AppState.logs) AppState.logs = { list: [] };
  if (!Array.isArray(AppState.logs.list)) AppState.logs.list = [];

  AppState.logs.list.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    ...entry
  });
}

/**
 * Отримати залишок компонента на складі (кг)
 */
export function getFeedStock(id) {
  return Number(AppState.warehouse.feed?.[id] || 0);
}

/**
 * Додати компонент на склад (кг)
 */
export function addFeedStock(id, amount) {
  const add = Number(amount || 0);
  if (add <= 0) return;

  if (!AppState.warehouse.feed) AppState.warehouse.feed = {};
  AppState.warehouse.feed[id] = getFeedStock(id) + add;

  // 🧾 LOG
  addLog({
    type: "feed:add",
    componentId: id,
    amount: add
  });
}

/**
 * Перевірка: чи вистачає компонента на складі
 */
export function canConsumeFeed(id, amount) {
  const need = Number(amount || 0);
  if (need <= 0) return true;
  return getFeedStock(id) >= need;
}

/**
 * Списати компонент зі складу (кг)
 * Повертає true/false
 */
export function consumeFeedStock(id, amount) {
  const need = Number(amount || 0);
  if (need <= 0) return true;

  if (!canConsumeFeed(id, need)) return false;

  AppState.warehouse.feed[id] = Math.max(getFeedStock(id) - need, 0);

  // 🧾 LOG
  addLog({
    type: "feed:consume",
    componentId: id,
    amount: need
  });

  return true;
}

/**
 * Очистити всі кормові компоненти складу
 */
export function clearFeedWarehouse() {
  AppState.warehouse.feed = {};

  // 🧾 LOG
  addLog({
    type: "feed:clear"
  });
}

/**
 * ============================
 * ЛОТКИ / РЕЗЕРВ
 * ============================
 */

/**
 * Порожні лотки (шт)
 */
export function getEmptyTrays() {
  return Number(AppState.warehouse.trays || 0);
}

/**
 * Додати порожні лотки (шт)
 */
export function addEmptyTrays(count) {
  const add = Number(count || 0);
  if (add <= 0) return;

  AppState.warehouse.trays = getEmptyTrays() + add;

  // 🧾 LOG
  addLog({
    type: "trays:add",
    amount: add
  });
}

/**
 * Зарезервовано лотків (шт)
 */
export function getReservedTrays() {
  return Number(AppState.warehouse.reserved || 0);
}

/**
 * Додати резерв (шт)
 */
export function reserveTrays(count) {
  const add = Number(count || 0);
  if (add <= 0) return;

  AppState.warehouse.reserved = getReservedTrays() + add;

  // 🧾 LOG
  addLog({
    type: "trays:reserve",
    amount: add
  });
}

/**
 * Зняти резерв (шт)
 */
export function releaseTrays(count) {
  const sub = Number(count || 0);
  if (sub <= 0) return;

  AppState.warehouse.reserved = Math.max(getReservedTrays() - sub, 0);

  // 🧾 LOG
  addLog({
    type: "trays:release",
    amount: sub
  });
}

/**
 * ============================
 * МІНІМАЛЬНІ ЗАЛИШКИ
 * ============================
 */

export function getWarehouseMinimums() {
  return AppState.warehouse.minimums || {};
}

export function setWarehouseMinimums(minimums) {
  AppState.warehouse.minimums = { ...(minimums || {}) };

  // 🧾 LOG
  addLog({
    type: "warehouse:set-minimums",
    minimums: { ...(minimums || {}) }
  });
}

/**
 * Повертає список попереджень по мінімумам
 */
export function getWarehouseWarnings(getComponentNameById) {
  const mins = getWarehouseMinimums();
  const warnings = [];

  const comps = AppState.feedComponents || [];
  comps.forEach(c => {
    const min = Number(mins[c.id] || 0);
    if (min <= 0) return;

    const stock = getFeedStock(c.id);
    if (stock < min) {
      warnings.push({
        type: "feed",
        id: c.id,
        name: typeof getComponentNameById === "function"
          ? getComponentNameById(c.id)
          : c.name,
        stock,
        min
      });
    }
  });

  const trayMin = Number(mins.empty_trays || 0);
  if (trayMin > 0) {
    const trayStock = getEmptyTrays();
    if (trayStock < trayMin) {
      warnings.push({
        type: "trays",
        id: "empty_trays",
        name: "Порожні лотки",
        stock: trayStock,
        min: trayMin
      });
    }
  }

  return warnings;
}