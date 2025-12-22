// src/controllers/OrdersFormController.js

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