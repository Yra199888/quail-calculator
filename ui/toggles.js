// ui/toggles.js

import { $ } from "../utils/dom.js";

function paint(btn, enabled, label) {
  if (!btn) return;
  btn.textContent = `${enabled ? "🔓" : "🔒"} ${label}`;
  btn.style.background = enabled ? "#b30000" : "#2e7d32";
  btn.style.color = "#fff";
}

export function syncToggleButtonsUI(AppState) {
  paint(
    document.querySelector(`button[onclick="toggleEggsEdit()"]`) || $("toggleEggsEditBtn"),
    AppState.ui.eggsEditEnabled,
    "Редагування яєць"
  );

  paint(
    document.querySelector(`button[onclick="toggleWarehouseEdit()"]`) || $("toggleWarehouseEditBtn"),
    AppState.ui.warehouseEditEnabled,
    "Редагування складу"
  );
}

export function toggleEggsEdit(AppState, saveAppState) {
  AppState.ui.eggsEditEnabled = !AppState.ui.eggsEditEnabled;
  saveAppState();
}

export function toggleWarehouseEdit(AppState, saveAppState) {
  AppState.ui.warehouseEditEnabled = !AppState.ui.warehouseEditEnabled;
  saveAppState();
}