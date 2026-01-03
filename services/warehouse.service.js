/**
 * warehouse.service.js
 * ---------------------------------------
 * Бізнес-логіка складу (БЕЗ DOM / БЕЗ HTML)
 */

import { AppState } from "../state/AppState.js";

/* =========================
   🧾 LOG HELPER (СТАБІЛЬНИЙ)
   ========================= */

let LOG_SILENT = false; // 👈 ДОДАНО

function addLog({ type, message = "", payload = {} }) {
  if (LOG_SILENT) return;

  if (!AppState.logs) {
    AppState.logs = { list: [] };
  }

  if (!Array.isArray(AppState.logs.list)) {
    AppState.logs.list = [];
  }

  AppState.logs.list.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    payload,
    createdAt: new Date().toISOString()
  });
}

// 👇 керування логами (ДОДАНО)
export function setLogSilent(value) {
  LOG_SILENT = Boolean(value);
}

// 👇 ОКРЕМИЙ лог змішування (ДОДАНО)
export function addMixLog(items) {
  addLog({
    type: "feed:mix",
    message: "Змішування корму",
    payload: {
      items: structuredClone(items)
    }
  });
}

/* =========================
   FEED
   ========================= */

export function getFeedStock(id) {
  return Number(AppState.warehouse.feed?.[id] || 0);
}

export function addFeedStock(id, amount) {
  const add = Number(amount || 0);
  if (add <= 0) return;

  if (!AppState.warehouse.feed) AppState.warehouse.feed = {};
  AppState.warehouse.feed[id] = getFeedStock(id) + add;

  addLog({
    type: "feed:add",
    message: "Додано корм на склад",
    payload: { componentId: id, amount: add }
  });
}

export function canConsumeFeed(id, amount) {
  const need = Number(amount || 0);
  if (need <= 0) return true;
  return getFeedStock(id) >= need;
}

export function consumeFeedStock(id, amount) {
  const need = Number(amount || 0);
  if (need <= 0) return true;
  if (!canConsumeFeed(id, need)) return false;

  AppState.warehouse.feed[id] = Math.max(getFeedStock(id) - need, 0);

  addLog({
    type: "feed:consume",
    message: "Списано корм зі складу",
    payload: { componentId: id, amount: need }
  });

  return true;
}

export function clearFeedWarehouse() {
  AppState.warehouse.feed = {};

  addLog({
    type: "feed:clear",
    message: "Склад корму очищено"
  });
}

/* =========================
   TRAYS
   ========================= */

export function getEmptyTrays() {
  return Number(AppState.warehouse.trays || 0);
}

export function addEmptyTrays(count) {
  const add = Number(count || 0);
  if (add <= 0) return;

  AppState.warehouse.trays = getEmptyTrays() + add;

  addLog({
    type: "trays:add",
    message: "Додано порожні лотки",
    payload: { amount: add }
  });
}

export function getReservedTrays() {
  return Number(AppState.warehouse.reserved || 0);
}

export function reserveTrays(count) {
  const add = Number(count || 0);
  if (add <= 0) return;

  AppState.warehouse.reserved = getReservedTrays() + add;

  addLog({
    type: "trays:reserve",
    message: "Зарезервовано лотки",
    payload: { amount: add }
  });
}

export function releaseTrays(count) {
  const sub = Number(count || 0);
  if (sub <= 0) return;

  AppState.warehouse.reserved = Math.max(getReservedTrays() - sub, 0);

  addLog({
    type: "trays:release",
    message: "Знято резерв лотків",
    payload: { amount: sub }
  });
}

/* =========================
   МІНІМУМИ
   ========================= */

export function getWarehouseMinimums() {
  return AppState.warehouse.minimums || {};
}

export function setWarehouseMinimums(minimums) {
  AppState.warehouse.minimums = { ...(minimums || {}) };

  addLog({
    type: "warehouse:set-minimums",
    message: "Оновлено мінімальні залишки",
    payload: { minimums }
  });
}

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