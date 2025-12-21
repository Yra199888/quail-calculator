// src/services/recipesService.js
import { uid } from "../utils/uid.js";

export function saveRecipe(AppState, name, components, volume) {
  const id = uid("recipe_");

  AppState.recipes.list[id] = {
    id,
    name,
    volume,
    components
  };

  AppState.recipes.selectedId = id;
  return id;
}

export function getRecipe(AppState, id) {
  return AppState.recipes.list[id] || null;
}

export function deleteRecipe(AppState, id) {
  delete AppState.recipes.list[id];
  if (AppState.recipes.selectedId === id) {
    AppState.recipes.selectedId = null;
  }
}