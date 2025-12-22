console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
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
// DRAG STATE (якщо в тебе було)
// =======================================
let draggedFeedId = null;

// =======================================
// START (ВАЖЛИВО: async + await loadState)
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    // 1) Спочатку завантажити дані (Firebase -> localStorage)
    await loadState();

    // 2) Потім гарантувати структуру
    ensureState();

    // 3) UI init
    initNavigation();
    initToggles();
    initWarnings();

    // 4) Перший рендер
    renderAll();

    // 5) Контролери
    initControllers();

    // 6) Global actions (делегація)
    initGlobalActions();

    // ✅ ВАЖЛИВО:
    // НЕ робимо saveState() на старті,
    // щоб випадково не перезаписати Cloud/Local дефолтним станом.

    // 7) Авто-рендер коли прийшов стан з Firebase realtime
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
// CONTROLLERS INIT
// =======================================
function initControllers() {
  // 🥚 Eggs
  new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };
      saveState();
      renderEggs();
      renderWarehouse();
    }
  });

  // 🌾 Feed
  const feedForm = new FeedFormController({
    onChange: ({ type, id, value }) => {
      if (type === "qty" || type === "price") {
        if (!id) return;

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
// GLOBAL UI ACTIONS (DELEGATION)
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {
    // ➕ Add component
    if (e.target.closest("#addFeedComponentBtn")) {
      addFeedComponent();
      return;
    }

    // ✔ Enable / disable
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

    // 🗑 Soft delete
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

    // ✏ Inline rename
    const name = e.target.closest(".feed-name");
    if (name) {
      startEditFeedName(name);
      return;
    }

    // ↩ Restore
    if (e.target.closest("#restoreFeedComponentsBtn")) {
      restoreFeedComponents();
      return;
    }
  });

  // Якщо в тебе був drag&drop — лишаємо як було (не ламає)
  document.addEventListener("dragstart", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    draggedFeedId = row.dataset.id;
    row.classList.add("dragging");
  });

  document.addEventListener("dragover", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    const targetRow = e.target.closest("tr[data-id]");
    if (!targetRow || !draggedFeedId) return;

    const targetId = targetRow.dataset.id;
    if (targetId === draggedFeedId) return;

    const list = AppState.feedComponents;
    const from = list.findIndex(c => c.id === draggedFeedId);
    const to = list.findIndex(c => c.id === targetId);
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
// ACTIONS
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
  const id = span.dataset.id;
  const c = AppState.feedComponents.find(x => x.id === id);
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
  if (!deleted.length) {
    alert("Немає видалених компонентів");
    return;
  }
  if (!confirm(`Відновити ${deleted.length}?`)) return;

  deleted.forEach(c => c.deleted = false);
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