// src/services/warehouseService.js

export function recomputeWarehouse(AppState) {
  const total = Number(AppState.eggs.totalTrays || 0);
  const reserved = Number(AppState.warehouse.reserved || 0);

  AppState.warehouse.ready = Math.max(total - reserved, 0);
}

export function hasEnoughComponent(AppState, id, need) {
  return Number(AppState.warehouse.feed[id] || 0) >= Number(need || 0);
}

export function consumeComponent(AppState, id, amount) {
  AppState.warehouse.feed[id] =
    Number(AppState.warehouse.feed[id] || 0) - Number(amount || 0);
}