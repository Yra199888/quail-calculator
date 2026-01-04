/**
 * warehouse.service.js
 * ---------------------------------------
 * Бізнес-логіка складу (БЕЗ DOM / БЕЗ HTML)
 */

import { AppState } from "../state/AppState.js";

/* =========================
   📲 TELEGRAM PUSH (ДОДАНО)
   ========================= */

const TG_TOKEN = "8587753988:AAED18mOkUVo3TniDRnU0pCLNT-5UzR7cdQ";
const TG_CHAT_ID = "6182525216";

function sendTelegram(text) {
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  }).catch(() => {});
}

/* =========================
   🧾 LOG HELPER (СТАБІЛЬНИЙ)
   ========================= */

let LOG_SILENT = false;

function addLog({ type, message = "", payload = {} }) {
  if (LOG_SILENT) return;

  if (!AppState.logs) AppState.logs = { list: [] };
  if (!Array.isArray(AppState.logs.list)) AppState.logs.list = [];

  AppState.logs.list.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    payload,
    createdAt: new Date().toISOString()
  });
}

export function setLogSilent(value) {
  LOG_SILENT = Boolean(value);
}

/* =========================
   🌾 FEED
   ========================= */

export function getFeedStock(id) {
  return Number(AppState.warehouse.feed?.[id] || 0);
}

export function addFeedStock(id, amount) {
  const add = Number(amount || 0);
  if (add <= 0) return;

  AppState.warehouse.feed[id] = getFeedStock(id) + add;

  addLog({
    type: "feed:add",
    message: "Додано корм на склад",
    payload: { componentId: id, amount: add }
  });

  sendTelegram(`➕ <b>Корм додано</b>\n${id} — ${add} кг`);
}

export function canConsumeFeed(id, amount) {
  return getFeedStock(id) >= Number(amount || 0);
}

export function consumeFeedStock(id, amount) {
  const need = Number(amount || 0);
  if (!canConsumeFeed(id, need)) return false;

  AppState.warehouse.feed[id] = Math.max(getFeedStock(id) - need, 0);

  addLog({
    type: "feed:consume",
    message: "Списано корм зі складу",
    payload: { componentId: id, amount: need }
  });

  sendTelegram(`➖ <b>Списано корм</b>\n${id} — ${need} кг`);
  return true;
}

/* =========================
   🌾 MIX FEED
   ========================= */

export function addMixLog(items) {
  addLog({
    type: "feed:mix",
    message: "Змішування корму",
    payload: { items }
  });

  sendTelegram(
    `🌾 <b>Змішано корм</b>\n` +
    items.map(i => `• ${i.componentId}: ${i.amount} кг`).join("\n")
  );
}

/* =========================
   🧺 TRAYS
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

  sendTelegram(`🧺 <b>Лотки додано</b>\n+${add} шт`);
}

/* =========================
   ⚠️ МІНІМУМИ
   ========================= */

export function getWarehouseMinimums() {
  return AppState.warehouse.minimums || {};
}

export function setWarehouseMinimums(minimums) {
  AppState.warehouse.minimums = { ...minimums };

  addLog({
    type: "warehouse:set-minimums",
    message: "Оновлено мінімальні залишки",
    payload: { minimums }
  });

  sendTelegram(`⚙️ <b>Оновлено мінімальні залишки складу</b>`);
}