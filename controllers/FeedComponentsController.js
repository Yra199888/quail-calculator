/**
 * FeedComponentsController
 * ------------------------
 * Відповідає ТІЛЬКИ за:
 * - додавання нового компонента корму
 *
 * ❌ НЕ рахує
 * ❌ НЕ рендерить
 * ❌ НЕ працює з localStorage
 */

import { AppState } from "../state/AppState.js";

export class FeedComponentsController {
  constructor({ onAdd }) {
    if (typeof onAdd !== "function") {
      throw new Error("FeedComponentsController: onAdd має бути функцією");
    }

    this.onAdd = onAdd;
    this.btn = null;
  }

  init() {
    this.btn = document.getElementById("addFeedComponentBtn");
    if (!this.btn) return;

    this.btn.addEventListener("click", () => {
      this.handleAdd();
    });
  }

  handleAdd() {
    const id = `custom_${Date.now()}`;

    const component = {
      id,
      name: "Новий компонент",
      kg: 0,
      price: 0,
      enabled: true
    };

    this.onAdd(component);
  }
}