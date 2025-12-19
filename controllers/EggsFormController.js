// controllers/EggsFormController.js
export class EggsFormController {
  constructor({ onSave }) {
    this.onSave = onSave;

    this.dateEl = document.getElementById("eggsDate");
    this.goodEl = document.getElementById("eggsGood");
    this.badEl = document.getElementById("eggsBad");
    this.homeEl = document.getElementById("eggsHome");
    this.saveBtn = document.getElementById("saveEggBtn");

    this.init();
  }

  init() {
    this.ensureDate();
    if (this.saveBtn) {
      this.saveBtn.addEventListener("click", () => this.handleSave());
    }
  }

  ensureDate() {
    if (this.dateEl && !this.dateEl.value) {
      this.dateEl.value = new Date().toISOString().slice(0, 10);
    }
  }

  handleSave() {
    const data = this.readForm();
    if (!this.validate(data)) return;

    this.onSave(data);
  }

  readForm() {
    return {
      date: this.dateEl.value,
      good: Number(this.goodEl.value || 0),
      bad: Number(this.badEl.value || 0),
      home: Number(this.homeEl.value || 0),
    };
  }

  validate({ good, bad, home }) {
    this.badEl.classList.remove("input-error");
    this.homeEl.classList.remove("input-error");

    if (bad + home > good) {
      this.badEl.classList.add("input-error");
      this.homeEl.classList.add("input-error");
      alert("Брак + для дому > кількості яєць");
      return false;
    }
    return true;
  }
}