// src/controllers/OrdersFormController.js
// =======================================
// Контролер форми замовлень
// ---------------------------------------
// ❗ НЕ працює з localStorage
// ❗ НЕ імпортує state.load / state.save
// Працює ТІЛЬКИ з AppState через app.js
// =======================================

import { saveState } from "../state/state.save.js";
import { renderWarehouse } from "../render/warehouse.render.js";
import { renderOrders } from "../render/orders.render.js";

export class OrdersFormController {
  constructor({ AppState }) {
    this.AppState = AppState;
  }

  /**
   * Додати нове замовлення
   */
  add(order) {
    this.AppState.orders.list.push(order);

    saveState();
    renderOrders();
    renderWarehouse();
  }

  /**
   * Змінити статус замовлення
   */
  setStatus(id, status) {
    const order = this.AppState.orders.list.find(o => o.id === id);
    if (!order) return;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    saveState();
    renderOrders();
    renderWarehouse();
  }
}