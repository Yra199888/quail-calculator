/**
 * app.js
 * ---------------------------------------
 * Головна точка входу додатку.
 * Тут НЕ має бути бізнес-логіки.
 * Лише:
 *  - ініціалізація state
 *  - запуск ensure
 *  - старт контролерів
 */

// ================================
// ІМПОРТИ STATE
// ================================
import { AppState } from "./state/AppState.js";
import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { ensureState } from "./state/state.ensure.js";

// ================================
// ІМПОРТИ КОНТРОЛЕРІВ
// ================================
import { EggsFormController } from "./controllers/EggsFormController.js";
import { FeedFormController } from "./controllers/FeedFormController.js";
import { FeedRecipesController } from "./controllers/FeedRecipesController.js";

// ================================
// ГЛОБАЛЬНИЙ ХЕЛПЕР (для дебагу)
// ================================
window.AppState = AppState;

// ================================
// START
// ================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.group("🚀 App start");

    // 1️⃣ Завантажуємо стан з localStorage
    loadState();
    console.log("✅ State loaded");

    // 2️⃣ Гарантуємо структуру (дефолти, фікси)
    ensureState();
    console.log("✅ State ensured");

    // 3️⃣ Ініціалізація контролерів
    initControllers();

    // 4️⃣ Фінальне збереження (на випадок нових дефолтів)
    saveState();
    console.log("✅ Initial save complete");

    console.groupEnd();
  } catch (e) {
    console.error("❌ Помилка запуску app.js", e);
    alert("❌ Помилка запуску додатку. Дивись console.");
  }
});

// ================================
// ІНІЦІАЛІЗАЦІЯ КОНТРОЛЕРІВ
// ================================
function initControllers() {
  console.group("🧩 Controllers init");

  // ===== ЯЙЦЯ =====
  const eggsForm = new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };
      saveState();
    }
  });

  // доступ для inline onclick (якщо буде потрібно)
  window.eggsForm = eggsForm;
  console.log("🥚 EggsFormController ready");

  // ===== КАЛЬКУЛЯТОР КОРМУ =====
  const feedForm = new FeedFormController({
    onChange: ({ type, index, value }) => {
      if (type === "qty") AppState.feedCalculator.qty[index] = value;
      if (type === "price") AppState.feedCalculator.price[index] = value;
      if (type === "volume") AppState.feedCalculator.volume = value;

      saveState();
    }
  });

  feedForm.init();
  console.log("🌾 FeedFormController ready");

  // ===== РЕЦЕПТИ КОРМУ =====
  new FeedRecipesController({
    AppState,
    saveState,
    refreshUI: () => {
      // UI-оновлення будуть підʼєднані пізніше
    }
  });

  console.log("📋 FeedRecipesController ready");

  console.groupEnd();
}