console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ прямої DOM-маніпуляції
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
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.group("🚀 App start");

    // 1) Load + ensure state
    loadState();
    ensureState();

    // 2) Init UI
    initNavigation();
    initToggles();
    initWarnings();

    // 3) First render
    renderAll();

    // 4) Init controllers
    initControllers();

    // 5) Global UI actions (delegation)
    initGlobalActions();

    // 6) Save after init
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
  console.log("typeof saveState =", typeof saveState);

  // 🥚 Eggs
  new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };
      saveState();
      renderEggs();
      renderWarehouse();
    }
  });

  // 🌾 Feed (100% id)
  const feedForm = new FeedFormController({
    onChange: ({ type, id, value }) => {

      if (type === "qty" || type === "price") {
        if (!id) return;

        if (!AppState.feedCalculator.qtyById) {
          AppState.feedCalculator.qtyById = {};
        }
        if (!AppState.feedCalculator.priceById) {
          AppState.feedCalculator.priceById = {};
        }

        if (type === "qty") {
          AppState.feedCalculator.qtyById[id] = value;
        }
        if (type === "price") {
          AppState.feedCalculator.priceById[id] = value;
        }
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

  // 📦 Orders
  new OrdersFormController({
    onSave: () => {
      saveState();
      renderOrders();
      renderWarehouse();
    }
  });

  // 📘 Recipes
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
// GLOBAL UI ACTIONS (EVENT DELEGATION)
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {

    // ➕ Додати компонент корму
    const addBtn = e.target.closest("#addFeedComponentBtn");
    if (addBtn) {
      addFeedComponent();
      return;
    }

  });
}

// =======================================
// ACTION: ADD FEED COMPONENT
// =======================================
function addFeedComponent() {
  const component = {
    id: `custom_${Date.now()}`,
    name: "Новий компонент",
    kg: 0,
    price: 0,
    enabled: true
  };

  AppState.feedComponents.push(component);

  if (!AppState.feedCalculator.qtyById) {
    AppState.feedCalculator.qtyById = {};
  }
  if (!AppState.feedCalculator.priceById) {
    AppState.feedCalculator.priceById = {};
  }

  AppState.feedCalculator.qtyById[component.id] = component.kg;
  AppState.feedCalculator.priceById[component.id] = component.price;

  saveState();
  renderFeed();
  renderWarehouse();
}

// =======================================
// GLOBAL RENDER
// =======================================
function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}