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

    // ✔ Enable / Disable компонент
    const toggle = e.target.closest(".feed-enable");
    if (toggle) {
      const id = toggle.dataset.id;
      const component = AppState.feedComponents.find((c) => c.id === id);
      if (!component) return;

      component.enabled = toggle.checked;

      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    // 🗑 Soft delete компонента (після toggle, як ти просив)
    const delBtn = e.target.closest(".feed-delete");
    if (delBtn) {
      const id = delBtn.dataset.id;
      const component = AppState.feedComponents.find((c) => c.id === id);
      if (!component) return;

      const ok = confirm(`Видалити компонент "${component.name}"?`);
      if (!ok) return;

      component.deleted = true;

      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    // ✏️ Inline edit назви компонента
    const nameSpan = e.target.closest(".feed-name");
    if (nameSpan) {
      startEditFeedName(nameSpan);
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
    enabled: true,
    deleted: false
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
// INLINE EDIT: FEED COMPONENT NAME
// =======================================
function startEditFeedName(span) {
  const id = span.dataset.id;
  const component = AppState.feedComponents.find((c) => c.id === id);
  if (!component) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = component.name || "";
  input.className = "feed-name-input";

  // заміна span -> input
  span.replaceWith(input);

  input.focus();
  input.select();

  const finish = (save) => {
    if (save) {
      const value = (input.value || "").trim();
      if (value) component.name = value;
      saveState();
    }
    renderFeed();
  };

  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
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