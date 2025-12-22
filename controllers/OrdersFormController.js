// src/controllers/OrdersFormController.js

import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { recomputeWarehouse } from "./services/warehouse.service.js";

export class OrdersFormController {
  constructor({ AppState, onUpdate }) {
    this.AppState = AppState;
    this.onUpdate = onUpdate;
  }

  add(order) {
    this.AppState.orders.list.push(order);
    recomputeWarehouse(this.AppState);
    saveAppState(this.AppState);
    this.onUpdate?.();
  }

  setStatus(id, status) {
    const o = this.AppState.orders.list.find(x => x.id === id);
    if (!o) return;

    o.status = status;
    o.updatedAt = new Date().toISOString();

    recomputeWarehouse(this.AppState);
    saveAppState(this.AppState);
    this.onUpdate?.();
  }
}