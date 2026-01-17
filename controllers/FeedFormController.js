/**
 * FeedFormController
 * ------------------
 * Контролер калькулятора корму.
 *
 * Відповідає ТІЛЬКИ за:
 * - зчитування input (кількість, ціна, обʼєм)
 * - реакцію на зміну значень
 * - реакцію на кнопку "Змішати корм"
 * - передачу змін через callback
 *
 * ❌ НЕ рахує собівартість
 * ❌ НЕ працює зі складом напряму
 * ❌ НЕ мутує AppState
 * ❌ НЕ містить бізнес-логіки
 */

export class FeedFormController {
  constructor({ onChange }) {
    if (typeof onChange !== "function") {
      throw new Error("FeedFormController: onChange має бути функцією");
    }

    this.onChange = onChange;

    // DOM
    this.table = null;
    this.volumeInput = null;
    this.mixBtn = null;
  }

  /**
   * Ініціалізація контролера
   * викликається ОДИН РАЗ після renderFeed()
   */
  init() {
    this.table = document.getElementById("feedTable");
    this.volumeInput = document.getElementById("feedVolume");
    this.mixBtn = document.getElementById("mixFeedBtn");

    if (this.table) {
      this.bindTableInputs();
    }

    if (this.volumeInput) {
      this.bindVolumeInput();
    }

    if (this.mixBtn) {
      this.bindMixButton();
    }
  }

  /* =======================================
     INPUTS TABLE
  ======================================= */

  bindTableInputs() {
    this.table.addEventListener("input", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (target.classList.contains("qty")) {
        this.handleQtyChange(target);
      }

      if (target.classList.contains("price")) {
        this.handlePriceChange(target);
      }
    });
  }

  /* =======================================
     VOLUME
  ======================================= */

  bindVolumeInput() {
    this.volumeInput.addEventListener("input", () => {
      const value = Number(this.volumeInput.value || 0);

      this.onChange({
        type: "volume",
        value
      });
    });
  }

  /* =======================================
     MIX BUTTON
  ======================================= */

  bindMixButton() {
    this.mixBtn.addEventListener("click", () => {
      this.onChange({
        type: "mix"
      });
    });
  }

  /* =======================================
     QTY
  ======================================= */

  handleQtyChange(input) {
    const value = Number(input.value || 0);

    if (input.dataset.id) {
      this.onChange({
        type: "qty",
        id: input.dataset.id,
        value
      });
      return;
    }

    // fallback (старі таблиці)
    if (input.dataset.i !== undefined) {
      this.onChange({
        type: "qty",
        index: Number(input.dataset.i),
        value
      });
    }
  }

  /* =======================================
     PRICE
  ======================================= */

  handlePriceChange(input) {
    const value = Number(input.value || 0);

    if (input.dataset.id) {
      this.onChange({
        type: "price",
        id: input.dataset.id,
        value
      });
      return;
    }

    // fallback (старі таблиці)
    if (input.dataset.i !== undefined) {
      this.onChange({
        type: "price",
        index: Number(input.dataset.i),
        value
      });
    }
  }
}