// src/controllers/EggsFormController.js

/**
 * 🥚 EggsFormController
 * ---------------------------------------
 * Контролює форму обліку яєць
 *
 * ❗ ВІДПОВІДАЄ ТІЛЬКИ ЗА:
 * - читання значень з форми
 * - валідацію
 * - виклик onSave
 */

export class EggsFormController {
  constructor({ onSave }) {
    if (typeof onSave !== "function") {
      throw new Error("EggsFormController: onSave має бути функцією");
    }

    this.onSave = onSave;

    this.dateEl = document.getElementById("eggs-date");
    this.goodEl = document.getElementById("eggs-good");
    this.badEl = document.getElementById("eggs-bad");
    this.homeEl = document.getElementById("eggs-home");
    this.saveBtn = document.getElementById("eggs-save-btn");

    if (!this.dateEl || !this.goodEl || !this.saveBtn) {
      console.warn("⚠️ EggsFormController: елементи форми не знайдені");
      return;
    }

    // дата за замовчуванням
    if (!this.dateEl.value) {
      this.dateEl.value = new Date().toISOString().slice(0, 10);
    }

    this.saveBtn.addEventListener("click", () => this.handleSave());
  }

  handleSave() {
    const date = this.dateEl.value;
    const good = Number(this.goodEl.value || 0);
    const bad = Number(this.badEl.value || 0);
    const home = Number(this.homeEl.value || 0);

    if (!date) {
      alert("Вкажи дату");
      return;
    }

    if (good < 0 || bad < 0 || home < 0) {
      alert("Значення не можуть бути відʼємними");
      return;
    }

    this.onSave({ date, good, bad, home });

    // очистка форми
    this.goodEl.value = "";
    this.badEl.value = "";
    this.homeEl.value = "";
  }
}