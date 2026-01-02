// src/services/logs.service.js
// =======================================
// Журнал дій (Operations Log)
// ---------------------------------------
// ✅ Працює ТІЛЬКИ з AppState
// ✅ НЕ робить saveState (це робить app.js / контролери)
// ✅ Soft-delete (deleted=true), щоб не губити історію
// =======================================

import { AppState } from "../state/AppState.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowStamp() {
  const d = new Date();
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return { date, time, iso: d.toISOString() };
}

function ensureLogs() {
  AppState.logs ||= {};
  AppState.logs.list ||= [];
}

/**
 * Додати запис в журнал
 * @param {string} type  - наприклад: "feed_add", "feed_use", "feed_mix", "order_ship"
 * @param {object} meta  - деталі дії (компонент, кг, клієнт, лотки, тощо)
 * @param {string} note  - опційний коментар
 * @returns {object} created log item
 */
export function addLog(type, meta = {}, note = "") {
  ensureLogs();

  const { date, time, iso } = nowStamp();

  const item = {
    id: `log_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: String(type || "unknown"),
    date,
    time,
    createdAt: iso,

    meta: meta && typeof meta === "object" ? meta : { value: meta },
    note: String(note || ""),

    deleted: false
  };

  // Нові записи — на початок (щоб одразу видно було останнє)
  AppState.logs.list.unshift(item);

  return item;
}

/**
 * Soft-delete запису (помилковий запис)
 */
export function softDeleteLog(id) {
  ensureLogs();
  const item = AppState.logs.list.find(x => x.id === id);
  if (!item) return false;

  item.deleted = true;
  item.deletedAt = new Date().toISOString();
  return true;
}

/**
 * Відновити soft-deleted запис
 */
export function restoreLog(id) {
  ensureLogs();
  const item = AppState.logs.list.find(x => x.id === id);
  if (!item) return false;

  item.deleted = false;
  item.restoredAt = new Date().toISOString();
  return true;
}

/**
 * Отримати список (можна приховати deleted)
 */
export function getLogs({ includeDeleted = true } = {}) {
  ensureLogs();
  return includeDeleted
    ? AppState.logs.list
    : AppState.logs.list.filter(x => !x.deleted);
}