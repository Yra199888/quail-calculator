// src/controllers/FeedFormController.js
import { computeFeedTotals } from "../services/feedCalculatorService.js";
import { saveAppState } from "../storage/storage.js";

export class FeedFormController {
  constructor({ AppState, onUpdate }) {
    this.AppState = AppState;
    this.onUpdate = onUpdate;
  }

  init() {
    document.addEventListener("input", e => {
      const el = e.target;
      const i = el.dataset.i;

      if (el.classList.contains("qty")) {
        this.AppState.feedCalculator.qty[i] = Number(el.value || 0);
      }

      if (el.classList.contains("price")) {
        this.AppState.feedCalculator.price[i] = Number(el.value || 0);
      }

      if (el.id === "feedVolume") {
        this.AppState.feedCalculator.volume = Number(el.value || 0);
      }

      this.recompute();
    });
  }

  recompute() {
    const { qty, price } = this.AppState.feedCalculator;

    const totals = computeFeedTotals(qty, price);

    this.AppState.feedCalculator.totalCost = totals.totalCost;
    this.AppState.feedCalculator.perKg = totals.perKg;

    saveAppState(this.AppState);
    this.onUpdate?.();
  }
}