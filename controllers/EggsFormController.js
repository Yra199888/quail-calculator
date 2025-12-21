// /src/controllers/FeedFormController.js
import { qs } from "../utils/dom.js";

export class FeedFormController {
  constructor({ AppState, onChange }) {
    this.AppState = AppState;
    this.onChange = onChange;
  }

  init() {
    this.bindTableInputs();
    this.bindVolumeInput();
  }

  // 🔹 Делегування подій — ОДИН listener
  bindTableInputs() {
    const table = qs("#feedTable");
    if (!table) return;

    table.addEventListener("input", (e) => {
      const el = e.target;

      const index = Number(el.dataset.i);
      if (Number.isNaN(index)) return;

      if (el.classList.contains("qty")) {
        this.AppState.feedCalculator.qty[index] = Number(el.value) || 0;
        this.emit("qty", index, el.value);
      }

      if (el.classList.contains("price")) {
        this.AppState.feedCalculator.price[index] = Number(el.value) || 0;
        this.emit("price", index, el.value);
      }
    });
  }

  bindVolumeInput() {
    const input = qs("#feedVolume");
    if (!input) return;

    input.addEventListener("input", () => {
      this.AppState.feedCalculator.volume = Number(input.value) || 0;
      this.emit("volume", null, input.value);
    });
  }

  emit(type, index, value) {
    if (typeof this.onChange === "function") {
      this.onChange({ type, index, value });
    }
  }
}