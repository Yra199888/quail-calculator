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
   */
  handleQtyChange(input) {
    const index = Number(input.dataset.i);
    const value = Number(input.value || 0);

    this.onChange({
      type: "qty",
      index,
      value
    });
  }

  /**
   * Обробка зміни ціни компонента
   */
  handlePriceChange(input) {
    const index = Number(input.dataset.i);
    const value = Number(input.value || 0);

    this.onChange({
      type: "price",
      index,
      value
    });
  }
}