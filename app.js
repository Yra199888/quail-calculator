console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 */

// =======================================
// FIREBASE (ВАЖЛИВО)
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
// DRAG STATE
// =======================================
let draggedFeedId = null;

// =======================================
// START
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    // ✅ 0️⃣ Firebase INIT — ПЕРШИМ
    initFirebase();

    // 1️⃣ Load state (Firebase → localStorage)
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
    window.addEventListener("appstate:updated", () => {
      renderAll();
    });

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

  new OrdersFormController({
    onSave: () => {
      saveState();
      renderOrders();
      renderWarehouse();
    }
  });

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
    if (e.target.closest("#addFeedComponentBtn")) {
      addFeedComponent();
      return;
    }

    const toggle = e.target.closest(".feed-enable");
    if (toggle) {
      const c = AppState.feedComponents.find(x => x.id === toggle.dataset.id);
      if (!c) return;
      c.enabled = toggle.checked;
      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    const del = e.target.closest(".feed-delete");
    if (del) {
      const c = AppState.feedComponents.find(x => x.id === del.dataset.id);
      if (!c) return;
      if (!confirm(`Видалити "${c.name}"?`)) return;
      c.deleted = true;
      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    const name = e.target.closest(".feed-name");
    if (name) {
      startEditFeedName(name);
      return;
    }

    if (e.target.closest("#restoreFeedComponentsBtn")) {
      restoreFeedComponents();
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

function startEditFeedName(span) {
  const c = AppState.feedComponents.find(x => x.id === span.dataset.id);
  if (!c) return;

  const input = document.createElement("input");
  input.value = c.name || "";
  input.className = "feed-name-input";

  span.replaceWith(input);
  input.focus();
  input.select();

  const finish = (ok) => {
    if (ok && input.value.trim()) {
      c.name = input.value.trim();
      saveState();
    }
    renderFeed();
  };

  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
}

function restoreFeedComponents() {
  const deleted = AppState.feedComponents.filter(c => c.deleted);
  if (!deleted.length) return alert("Немає видалених компонентів");
  if (!confirm(`Відновити ${deleted.length}?`)) return;

  deleted.forEach(c => c.deleted = false);
  saveState();
  renderFeed();
  renderWarehouse();
}

// =======================================
// 🧾 ORDERS ACTIONS
// =======================================

// ✔ Виконати замовлення
const doneBtn = e.target.closest("[data-order-done]");
if (doneBtn) {
  const id = doneBtn.dataset.orderDone;
  const order = AppState.orders.list.find(o => o.id === id);
  if (!order) return;

  if (order.status !== "reserved") return;

  const ok = confirm(
    `Виконати замовлення для "${order.client}" (${order.trays} лотків)?`
  );
  if (!ok) return;

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
  if (!order) return;

  if (order.status !== "reserved") return;

  const ok = confirm(
    `Скасувати замовлення для "${order.client}"?`
  );
  if (!ok) return;

  order.status = "canceled";
  order.canceledAt = new Date().toISOString();

  saveState();
  renderOrders();
  renderWarehouse();
  return;
}

function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}