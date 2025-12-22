/**
 * recipes.render.js
 * ---------------------------------------
 * Відповідає ТІЛЬКИ за відображення рецептів корму:
 *  - список збережених рецептів
 *  - назва рецепта
 *  - обʼєм
 *
 * ❌ БЕЗ бізнес-логіки
 * ❌ БЕЗ змін AppState
 * ❌ БЕЗ localStorage
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";

// =======================================
// ГОЛОВНИЙ РЕНДЕР
// =======================================
export function renderRecipes() {
  const listEl = qs("#recipesList");
  if (!listEl) return;

  listEl.innerHTML = "";

  const recipes = Object.values(AppState.recipes.list || {});

  if (recipes.length === 0) {
    listEl.innerHTML = `<div class="muted">Рецептів ще немає</div>`;
    return;
  }

  recipes.forEach(recipe => {
    const item = document.createElement("div");
    item.className = "recipe-item";

    item.innerHTML = `
      <div class="recipe-title">${recipe.name}</div>
      <div class="recipe-meta">
        Обʼєм: <b>${recipe.volume}</b> кг
      </div>
    `;

    listEl.appendChild(item);
  });
}