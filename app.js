console.log("🔥 app.js EXECUTED");
/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ DOM-маніпуляцій
 *
 * ✅ ТІЛЬКИ:
 *  - state
 *  - ensure
 *  - render
 *  - controllers
 */

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
import { renderEggsList } from "./render/eggs.render.js";
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
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.group("🚀 App start");

    loadState();
    ensureState();

    initNavigation();
    initToggles();
    initWarnings();

    renderAll();
    initControllers();

    saveState();

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
  console.group("🧩 Controllers");

  new EggsFormController({
    onSave: () => {
      saveState();
      renderEggsList();
      renderWarehouse();
    }
  });

  const feedForm = new FeedFormController({
    onChange: () => {
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
    }
  });

  new FeedRecipesController({
    onChange: () => {
      saveState();
      renderRecipes();
      renderFeed();
    }
  });

  console.groupEnd();
}

// =======================================
// GLOBAL RENDER
// =======================================
function renderAll() {
  renderEggsList();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}