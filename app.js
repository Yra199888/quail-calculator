console.log("🔥 app.js EXECUTED");
/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 *
 * Тут НЕ МАЄ бути:
 *  - бізнес-логіки
 *  - render-коду
 *  - роботи з DOM напряму
 *
 * ТУТ Є:
 *  - завантаження state
 *  - ensure структури
 *  - ініціалізація контролерів
 *  - старт UI
 */

// =======================================
// STATE
// =======================================
import { AppState } from "./state/AppState.js";
import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { ensureState } from "./state/state.ensure.js";
// =======================================
// CONTROLLERS (ФОРМИ)
// =======================================
import { EggsFormController } from "./controllers/EggsFormController.js";
import { FeedFormController } from "./controllers/FeedFormController.js";
import { OrdersFormController } from "./controllers/OrdersFormController.js";
import { FeedRecipesController } from "./controllers/FeedRecipesController.js";

// =======================================
// RENDER
// =======================================
import { renderEggsList } from "./render/eggs.render.js";
import { renderFeedCalculator } from "./render/feed.render.js";
import { renderWarehouse } from "./render/warehouse.render.js";
import { renderOrders } from "./render/orders.render.js";
import { renderRecipes } from "./render/recipes.render.js";

// =======================================
// UI
// =======================================
import { initNavigation } from "./ui/navigation.js";
import { initToggles } from "./ui/toggles.js";
import { initWarnings } from "./ui/warnings.js";

// =======================================
// DEBUG (тимчасово)
// =======================================
window.AppState = AppState;

// =======================================
// START
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.group("🚀 App start");

    // 1️⃣ Завантажуємо стан
    loadState();
    console.log("✅ State loaded");

    // 2️⃣ Гарантуємо структуру стану
    ensureState();
    console.log("✅ State ensured");

    // 3️⃣ UI (навігація, перемикачі, попередження)
    initNavigation();
    initToggles();
    initWarnings();
    console.log("✅ UI initialized");

    // 4️⃣ Рендер початкового стану
    renderAll();
    console.log("✅ Initial render");

    // 5️⃣ Контролери форм
    initControllers();
    console.log("✅ Controllers initialized");

    // 6️⃣ Фінальне збереження
    saveState();
    console.log("✅ Initial save");

    console.groupEnd();
  } catch (e) {
    console.error("❌ Помилка запуску app.js", e);
    alert("❌ Помилка запуску додатку. Дивись Console.");
  }
});

// =======================================
// ІНІЦІАЛІЗАЦІЯ КОНТРОЛЕРІВ
// =======================================
function initControllers() {
  console.group("🧩 Controllers");

  // 🥚 ЯЙЦЯ
  new EggsFormController({
    onSave: () => {
      saveState();
      renderEggs();
      renderWarehouse();
    }
  });

  // 🌾 КОРМ
  const feedForm = new FeedFormController({
    onChange: () => {
      saveState();
      renderFeed();
      renderWarehouse();
    }
  });
  feedForm.init();

  // 📑 ЗАМОВЛЕННЯ
  new OrdersFormController({
    onSave: () => {
      saveState();
      renderOrders();
    }
  });

  // 📋 РЕЦЕПТИ
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
// ГЛОБАЛЬНИЙ РЕНДЕР
// =======================================
function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}