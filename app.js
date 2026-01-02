console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 * ❗ НІЧОГО НЕ ВИДАЛЕНО
 * ❗ УСЕ, ЩО БУЛО — ЛИШИЛОСЬ
 */

// =======================================
// 🔥 FIREBASE — ОБОВʼЯЗКОВО ПЕРШИМ
// =======================================
import { initFirebase } from "./firebase/firebase.js";

// =======================================
// STATE
// =======================================
import { AppState } from "./state/AppState.js";
import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { ensureState } from "./state/state.ensure.js";

// =======================================
// SERVICES
// =======================================
import {
  getFeedStock,
  consumeFeedStock
} from "./services/warehouse.service.js";

// =======================================
// CONTROLLERS
// =======================================
import { EggsFormController } from "./controllers/EggsFormController.js";
import { FeedFormController } from "./controllers/FeedFormController.js";
import { OrdersFormController } from "./controllers/OrdersFormController.js";
import { FeedRecipesController } from "./controllers/FeedRecipesController.js";

// =======================================
// RENDER
// =======================================
import { renderEggs } from "./render/eggs.render.js";
import { renderFeed } from "./render/feed.render.js";
import { renderWarehouse } from "./render/warehouse.render.js";
import { renderOrders } from "./render/orders.render.js";
import { renderRecipes } from "./render/recipes.render.js";

// =======================================
// UI
// =======================================
import { initNavigation } from "./ui/navigation.js";
import { initToggles } from "./ui/toggles.js";
import { initWarnings } from "./ui/warnings.js";

// DEBUG
window.AppState = AppState;

// =======================================
// 🧲 DRAG STATE
// =======================================
let draggedFeedId = null;

// =======================================
// START
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    initFirebase();
    await loadState();
    ensureState();

    // ✅ журнал гарантовано існує
    if (!AppState.logs) {
      AppState.logs = { list: [] };
    }

    initNavigation();
    initToggles();
    initWarnings();

    renderAll();
    initControllers();
    initGlobalActions();

    window.addEventListener("appstate:updated", renderAll);

    console.groupEnd();
  } catch (e) {
    console.error("❌ Помилка запуску app.js", e);
    alert("❌ Помилка запуску додатку. Дивись Console.");
  }
});

// =======================================
// CONTROLLERS
// =======================================
function initControllers() {
  new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };

      AppState.logs.list.push({
        id: `log_${Date.now()}`,
        type: "eggs",
        message: `Запис яєць за ${date}: ${good} / ${bad} / ${home}`,
        createdAt: new Date().toISOString()
      });

      saveState();
      renderEggs();
      renderWarehouse();
    }
  });

  const feedForm = new FeedFormController({
    onChange: ({ type, id, value }) => {
      if ((type === "qty" || type === "price") && id) {
        AppState.feedCalculator.qtyById ||= {};
        AppState.feedCalculator.priceById ||= {};
        if (type === "qty") AppState.feedCalculator.qtyById[id] = value;
        if (type === "price") AppState.feedCalculator.priceById[id] = value;
      }

      if (type === "volume") {
        AppState.feedCalculator.volume = value;
      }

      saveState();
      renderFeed();
      renderWarehouse();
    }
  });

  feedForm.init();

  new OrdersFormController({ AppState });

  new FeedRecipesController({
    AppState,
    saveState,
    onChange: () => {
      saveState();
      renderRecipes();
      renderFeed();
    }
  });
}

// =======================================
// GLOBAL ACTIONS
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {

    // =========================
    // 🧾 ORDERS
    // =========================
    const addOrderBtn = e.target.closest("#order-add-btn");
    if (addOrderBtn) {
      const date = document.getElementById("order-date")?.value;
      const client = document.getElementById("order-client")?.value;
      const trays = Number(document.getElementById("order-trays")?.value || 0);
      const details = document.getElementById("order-details")?.value || "";

      if (!date || !client || trays <= 0) {
        alert("❌ Заповни дату, клієнта і кількість лотків");
        return;
      }

      AppState.orders.list.push({
        id: `order_${Date.now()}`,
        date,
        client,
        trays,
        details,
        status: "reserved",
        createdAt: new Date().toISOString()
      });

      AppState.logs.list.push({
        id: `log_${Date.now()}`,
        type: "order",
        message: `Нове замовлення: ${client}, ${trays} лотків`,
        createdAt: new Date().toISOString()
      });

      saveState();
      renderOrders();
      renderWarehouse();
      return;
    }

    // =========================
    // 🌾 MIX FEED
    // =========================
    const mixFeedBtn = e.target.closest("#mixFeedBtn");
    if (mixFeedBtn) {
      const components = AppState.feedComponents.filter(
        c => c.deleted !== true && c.enabled !== false
      );

      const toConsume = [];

      components.forEach(c => {
        const qty = Number(AppState.feedCalculator.qtyById?.[c.id] || 0);
        if (qty > 0) toConsume.push({ id: c.id, name: c.name, qty });
      });

      if (!toConsume.length) {
        alert("❌ Немає що змішувати");
        return;
      }

      if (!confirm("Змішати корм та списати зі складу?")) return;

      toConsume.forEach(x => consumeFeedStock(x.id, x.qty));

      AppState.logs.list.push({
        id: `log_${Date.now()}`,
        type: "feed",
        message: `Змішано корм: ${toConsume.map(x => `${x.name} ${x.qty}кг`).join(", ")}`,
        createdAt: new Date().toISOString()
      });

      saveState();
      renderWarehouse();
      return;
    }

    // =========================
    // ❌ DELETE LOG
    // =========================
    const delLogBtn = e.target.closest("[data-log-delete]");
    if (delLogBtn) {
      const id = delLogBtn.dataset.logDelete;
      if (!confirm("Видалити запис журналу?")) return;

      AppState.logs.list = AppState.logs.list.filter(l => l.id !== id);
      saveState();
      renderWarehouse();
      return;
    }
  });

  // ===============================
  // 🧲 DRAG & DROP FEED
  // ===============================
  document.addEventListener("dragstart", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    draggedFeedId = row.dataset.id;
    row.classList.add("dragging");
  });

  document.addEventListener("dragover", (e) => {
    if (e.target.closest("tr[data-id]")) e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    const targetRow = e.target.closest("tr[data-id]");
    if (!targetRow || !draggedFeedId) return;

    const list = AppState.feedComponents;
    const from = list.findIndex(c => c.id === draggedFeedId);
    const to = list.findIndex(c => c.id === targetRow.dataset.id);
    if (from === -1 || to === -1) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    draggedFeedId = null;
    saveState();
    renderFeed();
    renderWarehouse();
  });

  document.addEventListener("dragend", () => {
    draggedFeedId = null;
    document.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
  });
}

// =======================================
function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}