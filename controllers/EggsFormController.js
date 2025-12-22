/**
 * EggsFormController
 * ------------------
 * Контролер відповідає ТІЛЬКИ за:
 * - роботу з формою введення яєць
 * - читання значень з input
 * - базову валідацію
 * - передачу даних наверх через callback
 *
 * ❌ НЕ рахує лотки
 * ❌ НЕ змінює склад
 * ❌ НЕ працює з localStorage
 */

export class EggsFormController {
  constructor({ onSave }) {
    if (typeof onSave !== "function") {
      throw new Error("EggsFormController: onSave має бути функцією");
    }

    this.onSave = onSave;

    // DOM-елементи
    this.form = null;
    this.dateInput = null;
    this.goodInput = null;
    this.badInput = null;
    this.homeInput = null;
  }

  /**
   * Ініціалізація контролера
   * викликається ОДИН РАЗ після DOMContentLoaded
   */
  init() {
    this.form = document.getElementById("eggsForm");
    if (!this.form) return;

    this.dateInput = this.form.querySelector("#eggsDate");
    this.goodInput = this.form.querySelector("#eggsGood");
    this.badInput  = this.form.querySelector("#eggsBad");
    this.homeInput = this.form.querySelector("#eggsHome");

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  /**
   * Обробка submit форми
   */
  handleSubmit() {
    const data = this.collectData();
    if (!data) return;

    this.onSave(data);
    this.clearForm();
  }

  /**
   * Збір і валідація даних з форми
   */
  collectData() {
    const date = this.dateInput?.value;
    const good = Number(this.goodInput?.value || 0);
    const bad  = Number(this.badInput?.value || 0);
    const home = Number(this.homeInput?.value || 0);

    if (!date) {
      alert("❗ Вкажи дату");
      return null;
    }

    if (good < 0 || bad < 0 || home < 0) {
      alert("❗ Значення не можуть бути відʼємними");
      return null;
    }

    if (bad + home > good) {
      alert("❗ Брак + для дому не можуть перевищувати загальну кількість");
      return null;
    }

    return { date, good, bad, home };
  }

  /**
   * Очищення форми після збереження
   */
  clearForm() {
    this.goodInput.value = "";
    this.badInput.value = "";
    this.homeInput.value = "";
  }

  /**
   * Заповнення форми для редагування існуючого запису
   */
  startEdit(date, data) {
    if (!this.form) return;

    this.dateInput.value = date;
    this.goodInput.value = data.good ?? 0;
    this.badInput.value  = data.bad ?? 0;
    this.homeInput.value = data.home ?? 0;
  }
}