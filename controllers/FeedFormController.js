/**
 * FeedFormController
 * ------------------
 * Контролер калькулятора корму.
 *
 * Відповідає ТІЛЬКИ за:
 * - зчитування input (кількість, ціна, обʼєм)
 * - реакцію на зміну значень
 * - передачу змін через callback
 *
 * ❌ НЕ рахує собівартість
 * ❌ НЕ працює з AppState напряму
 * ❌ НЕ лізе у склад або рецепти
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
  }

  /**
   * Ініціалізація контролера
   * викликається ОДИН РАЗ після рендера таблиці
   */
  init() {
    this.table = document.getElementById("feedTable");
    this.volumeInput = document.getElementById("feedVolume");

    if (!this.table) return;

    this.bindTableInputs();
    this.bindVolumeInput();
  }

  /**
   * Підвʼязка input у таблиці (кількість + ціна)
   */
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

  /**
   * Підвʼязка input обʼєму замісу
   */
  bindVolumeInput() {
    if (!this.volumeInput) return;

    this.volumeInput.addEventListener("input", () => {
      const value = Number(this.volumeInput.value || 0);

      this.onChange({
        type: "volume",
        value
      });
    });
  }

  /**
   * Обробка зміни кількості компонента
   * Підтримує:
   * - data-id (новий варіант)
   * - data-i  (старий варіант, fallback)
   */
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

  /**
   * Обробка зміни ціни компонента
   * Підтримує:
   * - data-id (новий варіант)
   * - data-i  (старий варіант, fallback)
   */
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