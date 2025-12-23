// =======================================
// Контролер замовлень
// ---------------------------------------
// ❗ НЕ працює з localStorage напряму
// ❗ НЕ імпортує loadState
// ✅ Працює через AppState + saveState
// =======================================

import { saveState } from "../state/state.save.js";
import { renderWarehouse } from "../render/warehouse.render.js";
import { renderOrders } from "../render/orders.render.js";

export class OrdersFormController {
  constructor({ AppState }) {
    this.AppState = AppState;
  }

  /**
   * ➕ Додати нове замовлення
   * ❗ нічого не ламаємо — приймаємо як є
   */
  add(order) {
    this.AppState.orders.list.push({
      id: order.id || `order_${Date.now()}`,
      date: order.date ?? new Date().toISOString().slice(0, 10),
      client: order.client ?? "",
      trays: Number(order.trays || 0),
      details: order.details ?? "",
      status: order.status ?? "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    saveState();
    renderOrders();
    renderWarehouse();
  }

  /**
   * 🔄 УНІВЕРСАЛЬНИЙ метод (ЗАЛИШАЄМО!)
   * Потрібен для сумісності зі старим кодом
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

  /**
   * 🔒 Забронювати замовлення
   * (лотки ще НЕ списуються)
   */
  reserve(id) {
    this.setStatus(id, "reserved");
  }

  /**
   * ✅ Виконати замовлення
   * (саме тут вважаємо, що лотки списані)
   */
  complete(id) {
    this.setStatus(id, "done");
  }
}