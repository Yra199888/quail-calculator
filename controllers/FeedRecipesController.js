/**
 * FeedRecipesController
 * ---------------------
 * Контролер рецептів корму.
 *
 * Відповідає ТІЛЬКИ за:
 * - збереження рецепта з калькулятора
 * - застосування рецепта до калькулятора
 * - видалення рецепта
 * - синхронізацію select (UI)
 *
 * ❌ НЕ рахує собівартість
 * ❌ НЕ працює зі складом
 * ❌ НЕ списує корм
 */

export class FeedRecipesController {
  constructor({ AppState, saveState, refreshUI }) {
    if (!AppState) throw new Error("FeedRecipesController: AppState обовʼязковий");
    if (typeof saveState !== "function") {
      throw new Error("FeedRecipesController: saveState має бути функцією");
    }

    this.state = AppState;
    this.saveState = saveState;
    this.refreshUI = refreshUI;

    // DOM
    this.nameInput = document.getElementById("recipeName");
    this.select = document.getElementById("recipeSelect");
    this.saveBtn = document.getElementById("saveRecipeBtn");
    this.loadBtn = document.getElementById("loadRecipeBtn");
    this.deleteBtn = document.getElementById("deleteRecipeBtn");

    this.bindUI();
    this.renderSelect();
  }

  // ============================
  // UI
  // ============================

  bindUI() {
    if (this.saveBtn) {
      this.saveBtn.addEventListener("click", () => this.saveFromCalculator());
    }

    if (this.loadBtn) {
      this.loadBtn.addEventListener("click", () => this.applySelected());
    }

    if (this.deleteBtn) {
      this.deleteBtn.addEventListener("click", () => this.deleteSelected());
    }

    if (this.select) {
      this.select.addEventListener("change", () => {
        this.state.recipes.selectedId = this.select.value || null;
        this.saveState();
      });
    }
  }

  // ============================
  // ЛОГІКА РЕЦЕПТІВ
  // ============================

  saveFromCalculator() {
    const name = (this.nameInput?.value || "").trim();
    if (!name) {
      alert("Вкажи назву рецепта");
      return;
    }

    const active = this.getActiveComponents();
    const components = {};

    active.forEach((c, i) => {
      const qty = Number(this.state.feedCalculator.qty[i] || 0);
      if (qty > 0) components[c.id] = qty;
    });

    const id = "recipe_" + Date.now();

    this.state.recipes.list[id] = {
      id,
      name,
      volume: Number(this.state.feedCalculator.volume || 25),
      components
    };

    this.state.recipes.selectedId = id;

    this.saveState();
    this.renderSelect();
    this.refreshUI?.();

    alert("✅ Рецепт збережено");
  }

  applySelected() {
    const id = this.select?.value;
    if (!id) return;

    const recipe = this.state.recipes.list[id];
    if (!recipe) {
      alert("Рецепт не знайдено");
      return;
    }

    const active = this.getActiveComponents();

    // очистка калькулятора
    this.state.feedCalculator.qty = active.map(() => 0);
    this.state.feedCalculator.volume = recipe.volume || 25;

    // накладання рецепта
    active.forEach((c, i) => {
      if (recipe.components[c.id] != null) {
        this.state.feedCalculator.qty[i] =
          Number(recipe.components[c.id] || 0);
      }
    });

    this.state.recipes.selectedId = id;

    this.saveState();
    this.refreshUI?.();

    alert(`🍲 Рецепт "${recipe.name}" застосовано`);
  }

  deleteSelected() {
    const id = this.select?.value;
    if (!id) return;

    const recipe = this.state.recipes.list[id];
    if (!recipe) return;

    if (!confirm(`Видалити рецепт "${recipe.name}"?`)) return;

    delete this.state.recipes.list[id];

    if (this.state.recipes.selectedId === id) {
      this.state.recipes.selectedId = null;
    }

    this.saveState();
    this.renderSelect();

    alert("🗑️ Рецепт видалено");
  }

  // ============================
  // RENDER
  // ============================

  renderSelect() {
    if (!this.select) return;

    this.select.innerHTML = "<option value=''>— обери рецепт —</option>";

    const recipes = Object.values(this.state.recipes.list || {});
    recipes.sort((a, b) => a.name.localeCompare(b.name));

    recipes.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;

      if (this.state.recipes.selectedId === r.id) {
        opt.selected = true;
      }

      this.select.appendChild(opt);
    });
  }

  // ============================
  // HELPERS
  // ============================

  getActiveComponents() {
    return (this.state.feedComponents || []).filter(c => c.enabled);
  }
}