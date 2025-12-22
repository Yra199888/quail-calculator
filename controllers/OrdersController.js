/**
 * OrdersController.js
 * ---------------------------------------
 * Контролер замовлень.
 * Вся бізнес-логіка замовлень зосереджена тут.
 */

import { AppState } from "../state/AppState.js";
import { saveState } from "../state/state.save.js";
import { renderOrders } from "../render/render.orders.js";
import { renderWarehouse } from "../render/render.warehouse.js";

/**
 * Ініціалізація контролера
 */
export function initOrdersController() {
  bindOrdersActions();
}

/**
 * Підʼєднання подій до кнопок у render.orders
 */
function bindOrdersActions() {
  const box = document.getElementById("ordersList");
  if (!box) return;

  box.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    if (action === "deliver") setOrderStatus(id, "delivered");
    if (action === "cancel") setOrderStatus(id, "cancelled");
    if (action === "delete") deleteOrder(id);
  });
}

/**
 * Додати нове замовлення
 */
export function addOrder({ date, client, trays, details }) {
  if (!client || trays <= 0) return;

  const free = getFreeTrays();
  if (trays > free) {
    alert(`Недостатньо вільних лотків. Доступно: ${free}`);
    return;
  }

  // резервуємо лотки
  AppState.warehouse.reserved += trays;

  AppState.orders.list.push({
    id: generateId(),
    date,
    client,
    trays,
    details,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  saveAndRender();
}

/**
 * Зміна статусу замовлення
 */
function setOrderStatus(id, nextStatus) {
  const order = getOrderById(id);
  if (!order) return;

  const prevStatus = order.status;

  // зняття резерву
  if (
    prevStatus === "confirmed" &&
    (nextStatus === "delivered" || nextStatus === "cancelled")
  ) {
    AppState.warehouse.reserved = Math.max(
      AppState.warehouse.reserved - order.trays,
      0
    );
  }

  // повторне резервування
  if (
    (prevStatus === "draft" || prevStatus === "cancelled") &&
    nextStatus === "confirmed"
  ) {
    const free = getFreeTrays();
    if (order.trays > free) {
      alert(`Недостатньо лотків. Доступно: ${free}`);
      return;
    }
    AppState.warehouse.reserved += order.trays;
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();

  saveAndRender();
}

/**
 * Видалити замовлення
 */
function deleteOrder(id) {
  const order = getOrderById(id);
  if (!order) return;

  if (!confirm("Видалити замовлення?")) return;

  if (order.status === "confirmed") {
    AppState.warehouse.reserved = Math.max(
      AppState.warehouse.reserved - order.trays,
      0
    );
  }

  AppState.orders.list = AppState.orders.list.filter(o => o.id !== id);

  saveAndRender();
}

/**
 * ============================
 * HELPERS
 * ============================
 */

function getOrderById(id) {
  return AppState.orders.list.find(o => o.id === id);
}

function getFreeTrays() {
  const total = Number(AppState.eggs.totalTrays || 0);
  const reserved = Number(AppState.warehouse.reserved || 0);
  return Math.max(total - reserved, 0);
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function saveAndRender() {
  saveState();
  renderOrders();
  renderWarehouse();
}