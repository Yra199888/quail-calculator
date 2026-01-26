console.log("🔥 app.js EXECUTED");

/**
 * app.js
 * =======================================
 * 🚀 Головна точка входу додатку
 * ❗ НІЧОГО НЕ ВИДАЛЕНО
 * ❗ УСЕ, ЩО БУЛО — ЛИШИЛОСЬ
 */

// =======================================
// 🔥 FIREBASE — ОБОВʼЯЗКОВО ПЕРШИМ
// =======================================
import { initFirebase } from "./firebase/firebase.js";

// =======================================
// СТАН
// =======================================
import { AppState } from "./state/AppState.js";
import { loadState } from "./state/state.load.js";
import { saveState } from "./state/state.save.js";
import { ensureState } from "./state/state.ensure.js";

// ✅ потрібно для mixFeedBtn
// ✅ + для “один лог змішування” (setLogSilent + addMixLog)
// ✅ + для кнопок ➕ (addFeedStock) у складі
import {
  getFeedStock,
  addFeedStock, // ✅ ДОДАНО
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

// =======================================
// РЕНДЕР
// =======================================
import { renderEggs } from "./render/eggs.render.js";
import { renderFeed } from "./render/feed.render.js";
import { renderWarehouse } from "./render/warehouse.render.js";
import { renderOrders } from "./render/orders.render.js";
import { renderRecipes } from "./render/recipes.render.js";

// =======================================
// ІНТЕРФЕЙС
// =======================================
import { initNavigation } from "./ui/navigation.js";
import { initToggles } from "./ui/toggles.js";
import { initWarnings } from "./ui/warnings.js";

// =======================================
// КЛІТКИ
// =======================================
import { renderCages } from "./render/cages.render.js";
import { CagesController } from "./controllers/CagesController.js";

// НАЛАГОДЖЕННЯ
window.AppState = AppState;

// =======================================
// 🧲 СТАН ПЕРЕТЯГУВАННЯ КОМПОНЕНТІВ КОРМУ
// =======================================
let draggedFeedId = null;

// =======================================
// СТАРТ
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.group("🚀 App start");

    // 0️⃣ Firebase
    initFirebase();

    // 1️⃣ Завантаження стану
    await loadState();

    // 2️⃣ Забезпечення структури
    ensureState();

    // 3️⃣ Ініціалізація інтерфейсу
    initNavigation();
    initToggles();
    initWarnings();

    // 4️⃣ Перший рендер
    renderAll();

    // 5️⃣ Контролери
    initControllers();

    // 6️⃣ Глобальні дії
    initGlobalActions();

    // 7️⃣ Реакція на оновлення стану
    window.addEventListener("appstate:updated", renderAll);

    console.groupEnd();
  } catch (e) {
    console.error("❌ Помилка запуску app.js", e);
    alert("❌ Помилка запуску додатку. Дивись Console.");
  }
});

// =======================================
// КОНТРОЛЕРИ
// =======================================
function initControllers() {
  // 🥚 Яйця
  new EggsFormController({
    onSave: ({ date, good, bad, home }) => {
      AppState.eggs.records[date] = { good, bad, home };
      saveState();
      renderEggs();
      renderWarehouse();
    }
  });

  // 🌾 Корм
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

  // 📦 Замовлення
  new OrdersFormController({ AppState });

  // 📘 Рецепти
  new FeedRecipesController({
    AppState,
    saveState,
    onChange: () => {
      saveState();
      renderRecipes();
      renderFeed();
    }
  });

  // 🐦 Клітки
  new CagesController({
    saveState,
    onChange: () => {
      saveState();
      renderCages();
    }
  });
}

Ось частина 

// =======================================
// ГЛОБАЛЬНІ ДІЇ (УСЯ ДЕЛЕГАЦІЯ)
// =======================================
function initGlobalActions() {
  document.addEventListener("click", (e) => {
    // =========================
    // 🧾 ЖУРНАЛ (ФІЛЬТР / ВИДАЛЕННЯ)
    // =========================

    // фільтр журналу
    const filterBtn = e.target.closest("[data-log-filter]");
    if (filterBtn) {
      const f = filterBtn.dataset.logFilter || "all";
      AppState.ui ||= {};
      AppState.ui.logsFilter = f;
      saveState();
      renderWarehouse();
      return;
    }

    // видалити запис журналу
    const delLogBtn = e.target.closest("[data-log-delete]");
    if (delLogBtn) {
      const id = delLogBtn.dataset.logDelete;
      if (!id) return;

      if (!confirm("Видалити цей запис з журналу?")) return;

      if (!AppState.logs) AppState.logs = { list: [] };
      if (!Array.isArray(AppState.logs.list)) AppState.logs.list = [];

      AppState.logs.list = AppState.logs.list.filter((l) => l.id !== id);

      saveState();
      renderWarehouse();
      return;
    }

    // =========================
    // 📑 ЗАМОВЛЕННЯ
    // =========================

    const addOrderBtn = e.target.closest("#order-add-btn");
    if (addOrderBtn) {
      const date = document.getElementById("order-date")?.value;
      const client = document.getElementById("order-client")?.value;
      const trays = Number(document.getElementById("order-trays")?.value || 0);
      const details = document.getElementById("order-details")?.value || "";

      if (!date || !client || trays <= 0) {
        alert("❌ Заповни дату, клієнта і кількість лотків");
        return;
      }

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

      document.getElementById("order-date").value = "";
      document.getElementById("order-client").value = "";
      document.getElementById("order-trays").value = "";
      document.getElementById("order-details").value = "";
      return;
    }

    const doneBtn = e.target.closest("[data-order-done]");
    if (doneBtn) {
      const order = AppState.orders.list.find(
        (o) => o.id === doneBtn.dataset.orderDone
      );
      if (!order || order.status !== "reserved") return;

      if (
        !confirm(
          `Виконати замовлення для "${order.client}" (${order.trays} лотків)?`
        )
      )
        return;

      order.status = "done";
      order.completedAt = new Date().toISOString();

      AppState.warehouse.traysShipped ||= 0;
      AppState.warehouse.traysShipped += order.trays;

      saveState();
      renderOrders();
      renderWarehouse();
      return;
    }

    const cancelBtn = e.target.closest("[data-order-cancel]");
    if (cancelBtn) {
      const order = AppState.orders.list.find(
        (o) => o.id === cancelBtn.dataset.orderCancel
      );
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
    // 🌾 ЗМІШАТИ КОРМ (1 ЗАПИС У ЖУРНАЛІ feed:mix)
    // =========================
    const mixFeedBtn = e.target.closest("#mixFeedBtn");
    if (mixFeedBtn) {
      const components = (AppState.feedComponents || []).filter(
        (c) => c.deleted !== true && c.enabled !== false
      );

      if (!components.length) {
        alert("❌ Немає активних компонентів");
        return;
      }

      const shortages = [];
      const toConsume = [];

      components.forEach((c) => {
        const qty =
          typeof AppState.feedCalculator.qtyById?.[c.id] === "number"
            ? AppState.feedCalculator.qtyById[c.id]
            : Number(c.kg || 0);

        if (qty <= 0) return;

        const stock = getFeedStock(c.id);

        if (stock < qty) {
          shortages.push(`${c.name}: потрібно ${qty}, є ${stock}`);
        } else {
          toConsume.push({ id: c.id, name: c.name, qty });
        }
      });

      if (shortages.length) {
        alert("❌ Недостатньо корму:\n\n" + shortages.join("\n"));
        return;
      }

      if (!toConsume.length) {
        alert("❌ Немає що змішувати");
        return;
      }

      if (
        !confirm(
          "Змішати корм та списати зі складу?\n\n" +
            toConsume.map((x) => `• ${x.name}: ${x.qty} кг`).join("\n")
        )
      )
        return;

      try {
        setLogSilent(true);
        toConsume.forEach((x) => consumeFeedStock(x.id, x.qty));
      } finally {
        setLogSilent(false);
      }

      addMixLog(
        toConsume.map((x) => ({
          componentId: x.id,
          name: x.name,
          amount: x.qty
        }))
      );

      saveState();
      renderWarehouse();
      alert("✅ Корм змішано та списано зі складу");
      return;
    }

    // =========================
    // 🌾 КОРМ (ІНТЕРФЕЙС)
    // =========================
    if (e.target.closest("#addFeedComponentBtn")) {
      addFeedComponent();
      return;
    }

    const toggle = e.target.closest(".feed-enable");
    if (toggle) {
      const c = AppState.feedComponents.find((x) => x.id === toggle.dataset.id);
      if (!c) return;
      c.enabled = toggle.checked;
      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    const del = e.target.closest(".feed-delete");
    if (del) {
      const c = AppState.feedComponents.find((x) => x.id === del.dataset.id);
      if (!c) return;
      if (!confirm(`Видалити "${c.name}"?`)) return;
      c.deleted = true;
      saveState();
      renderFeed();
      renderWarehouse();
      return;
    }

    const name = e.target.closest(".feed-name");
    if (name) startEditFeedName(name);

    if (e.target.closest("#restoreFeedComponentsBtn")) restoreFeedComponents();
  });

  // ===============================
  // 🧲 ПЕРЕТЯГУВАННЯ КОМПОНЕНТІВ КОРМУ
  // ===============================
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
    const from = list.findIndex((c) => c.id === draggedFeedId);
    const to = list.findIndex((c) => c.id === targetRow.dataset.id);
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
    document
      .querySelectorAll(".dragging")
      .forEach((el) => el.classList.remove("dragging"));
  });
}

// =======================================
// ДОПОМІЖНІ ФУНКЦІЇ
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
  const c = AppState.feedComponents.find((x) => x.id === span.dataset.id);
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
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
}

function restoreFeedComponents() {
  const deleted = AppState.feedComponents.filter((c) => c.deleted);
  if (!deleted.length) return alert("Немає видалених компонентів");
  if (!confirm(`Відновити ${deleted.length}?`)) return;

  deleted.forEach((c) => (c.deleted = false));
  saveState();
  renderFeed();
  renderWarehouse();
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