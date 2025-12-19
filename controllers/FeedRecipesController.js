export class FeedRecipesController {
  constructor({ AppState, saveAppState, refreshUI }) {
    this.AppState = AppState;
    this.saveAppState = saveAppState;
    this.refreshUI = refreshUI;

    this.els = {
      name: document.getElementById("recipeName"),
      select: document.getElementById("recipeSelect"),
      save: document.getElementById("saveRecipeBtn"),
      load: document.getElementById("loadRecipeBtn"),
      del: document.getElementById("deleteRecipeBtn"),
    };

    this.bind();
    this.renderSelect();
  }

  bind() {
    this.els.save?.addEventListener("click", () => this.save());
    this.els.load?.addEventListener("click", () => this.load());
    this.els.del?.addEventListener("click", () => this.remove());
    this.els.select?.addEventListener("change", e => {
      this.AppState.recipes.selectedId = e.target.value || null;
    });
  }

  save() {
    const name = this.els.name.value.trim();
    if (!name) return alert("Вкажи назву рецепту");

    const id = this.AppState.recipes.selectedId || Date.now().toString();

    this.AppState.recipes.list[id] = {
      id,
      name,
      qty: [...this.AppState.feedCalculator.qty],
      price: [...this.AppState.feedCalculator.price],
      volume: this.AppState.feedCalculator.volume,
      updatedAt: new Date().toISOString()
    };

    this.AppState.recipes.selectedId = id;
    this.saveAppState();
    this.renderSelect();
    alert("✅ Рецепт збережено");
  }

  load() {
    const id = this.AppState.recipes.selectedId;
    if (!id) return alert("Рецепт не вибрано");

    const r = this.AppState.recipes.list[id];
    if (!r) return;

    this.AppState.feedCalculator.qty = [...r.qty];
    this.AppState.feedCalculator.price = [...r.price];
    this.AppState.feedCalculator.volume = r.volume;

    this.saveAppState();
    this.refreshUI();
    alert("📂 Рецепт завантажено");
  }

  remove() {
    const id = this.AppState.recipes.selectedId;
    if (!id) return alert("Рецепт не вибрано");
    if (!confirm("Видалити рецепт?")) return;

    delete this.AppState.recipes.list[id];
    this.AppState.recipes.selectedId = null;

    this.saveAppState();
    this.renderSelect();
    alert("🗑️ Рецепт видалено");
  }

  renderSelect() {
    if (!this.els.select) return;

    this.els.select.innerHTML = `<option value="">— обери рецепт —</option>`;

    Object.values(this.AppState.recipes.list).forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      if (r.id === this.AppState.recipes.selectedId) opt.selected = true;
      this.els.select.appendChild(opt);
    });
  }
}