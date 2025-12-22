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
// DRAG STATE
// =======================================
let draggedFeedId = null;

// =======================================
// START
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    // 1️⃣ Завантажити стан (Firebase → localStorage)
    await loadState();

    // 2️⃣ Гарантувати структуру
    ensureState();

    // 3️⃣ UI
    initNavigation();
    initToggles();
    initWarnings();

    // 4️⃣ Перший рендер
    renderAll();

    // 5️⃣ Контролери
    initControllers();

    // 6️⃣ Делеговані дії
    initGlobalActions();

    // 7️⃣ Realtime update з Firebase
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

function renderAll() {
  renderEggs();
  renderFeed();
  renderWarehouse();
  renderOrders();
  renderRecipes();
}