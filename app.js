console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 */

// =======================================
// FIREBASE
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
// START
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    // 0️⃣ Firebase — ОБОВʼЯЗКОВО першим
    initFirebase();

    // 1️⃣ Load state
    await loadState();

    // 2️⃣ Ensure structure
    ensureState();

    // 3️⃣ UI
    initNavigation();
    initToggles();
    initWarnings();

    // 4️⃣ First render
    renderAll();

    // 5️⃣ Controllers
    initControllers();

    // 6️⃣ Global actions
    initGlobalActions();

    // 7️⃣ Realtime Firebase updates
    window.addEventListener("appstate:updated", renderAll);

    console.groupEnd();
  } catch (e) {
    console.error("❌ Помилка запуску app.js", e);
    alert("❌ Помилка запуску додатку. Дивись Console.");
  }
});

// =======================================
// CONTROLLERS INIT
// =======================================
function initControllers() {
  new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };
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
// GLOBAL ACTIONS (ВСЯ ДЕЛЕГАЦІЯ ТУТ)
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {

    // =========================
    // 🧾 ORDERS
    // =========================

    // ✔ Виконати замовлення
    const doneBtn = e.target.closest("[data-order-done]");
    if (doneBtn) {
      const id = doneBtn.dataset.orderDone;
      const order = AppState.orders.list.find(o => o.id === id);
      if (!order || order.status !== "reserved") return;

      if (!confirm(`Виконати замовлення для "${order.client}" (${order.trays} лотків)?`)) return;

      order.status = "done";
      order.completedAt = new Date().toISOString();

      saveState();
      renderOrders();
      renderWarehouse();
      return;
    }

    // ✖ Скасувати замовлення
    const cancelBtn = e.target.closest("[data-order-cancel]");
    if (cancelBtn) {
      const id = cancelBtn.dataset.orderCancel;
      const order = AppState.orders.list.find(o => o.id === id);
      if (!order || order.status !== "reserved") return;

      if (!confirm(`Скасувати замовлення для "${order.client}"?`)) return;

      order.status = "canceled";
      order.canceledAt = new Date().toISOString();

      saveState();
      renderOrders();
      renderWarehouse();
      return;
    }

    // =========================
    // FEED / UI (як було)
    // =========================
    if (e.target.closest("#addFeedComponentBtn")) {
      addFeedComponent();
      return;
    }
  });
}

// =======================================
// HELPERS
// =======================================
function addFeedComponent() {
  const c = {
    id: `custom_${Date.now()}`,
    name: "Новий компонент",
    kg: 0,
    price: 0,
    enabled: true,
    deleted: false
  };

  AppState.feedComponents.push(c);
  AppState.feedCalculator.qtyById ||= {};
  AppState.feedCalculator.priceById ||= {};
  AppState.feedCalculator.qtyById[c.id] = 0;
  AppState.feedCalculator.priceById[c.id] = 0;

  saveState();
  renderFeed();
  renderWarehouse();
}

function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}