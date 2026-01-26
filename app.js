console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 * ❗ СКЛАД ПОВНІСТЮ ВИНЕСЕНИЙ У warehouse.render.js
 */

// =======================================
// 🔥 FIREBASE
// =======================================
import { initFirebase } from "./firebase/firebase.js";

// =======================================
// СТАН
// =======================================
import { AppState } from "./state/AppState.js";
import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { ensureState } from "./state/state.ensure.js";

// =======================================
// СЕРВІСИ (ТІЛЬКИ ДЛЯ mixFeedBtn)
// =======================================
import {
  getFeedStock,
  consumeFeedStock,
  setLogSilent,
  addMixLog
} from "./services/warehouse.service.js";

// =======================================
// КОНТРОЛЕРИ
// =======================================
import { EggsFormController } from "./controllers/EggsFormController.js";
import { FeedFormController } from "./controllers/FeedFormController.js";
import { OrdersFormController } from "./controllers/OrdersFormController.js";
import { FeedRecipesController } from "./controllers/FeedRecipesController.js";
import { CagesController } from "./controllers/CagesController.js";

// =======================================
// РЕНДЕР
// =======================================
import { renderEggs } from "./render/eggs.render.js";
import { renderFeed } from "./render/feed.render.js";
import { renderWarehouse } from "./render/warehouse.render.js";
import { renderOrders } from "./render/orders.render.js";
import { renderRecipes } from "./render/recipes.render.js";
import { renderCages } from "./render/cages.render.js";

// =======================================
// UI
// =======================================
import { initNavigation } from "./ui/navigation.js";
import { initToggles } from "./ui/toggles.js";
import { initWarnings } from "./ui/warnings.js";

window.AppState = AppState;

// =======================================
// START
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    initFirebase();
    await loadState();
    ensureState();

    initNavigation();
    initToggles();
    initWarnings();

    renderAll();
    initControllers();
    initGlobalActions();

    window.addEventListener("appstate:updated", renderAll);
  } catch (e) {
    console.error("❌ App init error", e);
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
      AppState.feedCalculator.qtyById ||= {};
      AppState.feedCalculator.priceById ||= {};

      if (type === "qty") AppState.feedCalculator.qtyById[id] = value;
      if (type === "price") AppState.feedCalculator.priceById[id] = value;
      if (type === "volume") AppState.feedCalculator.volume = value;

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

  new CagesController({
    saveState,
    onChange: () => {
      saveState();
      renderCages();
    }
  });
}

// =======================================
// GLOBAL ACTIONS (БЕЗ СКЛАДУ)
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {

    // =========================
    // 📑 ЗАМОВЛЕННЯ
    // =========================
    if (e.target.closest("#order-add-btn")) {
      const date = document.getElementById("order-date")?.value;
      const client = document.getElementById("order-client")?.value;
      const trays = Number(document.getElementById("order-trays")?.value || 0);
      const details = document.getElementById("order-details")?.value || "";

      if (!date || !client || trays <= 0) return;

      AppState.orders.list.push({
        id: `order_${Date.now()}`,
        date,
        client,
        trays,
        details,
        status: "reserved",
        createdAt: new Date().toISOString()
      });

      saveState();
      renderOrders();
      renderWarehouse();
      return;
    }

    // =========================
    // 🌾 ЗАМІС КОРМУ
    // =========================
    if (e.target.closest("#mixFeedBtn")) {
      const items = [];

      (AppState.feedComponents || []).forEach(c => {
        const qty = AppState.feedCalculator.qtyById?.[c.id] || 0;
        if (qty > 0 && getFeedStock(c.id) >= qty) {
          items.push({ componentId: c.id, name: c.name, amount: qty });
        }
      });

      if (!items.length) return;

      setLogSilent(true);
      items.forEach(i => consumeFeedStock(i.componentId, i.amount));
      setLogSilent(false);

      addMixLog(items);
      saveState();
      renderWarehouse();
      alert("✅ Корм змішано");
    }
  });
}

// =======================================
function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
  renderCages();
}