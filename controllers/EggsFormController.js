window.EggsFormController = class EggsFormController {
  constructor({ onSave }) {
    this.onSave = onSave;

    this.dateEl = document.getElementById("eggsDate");
    this.goodEl = document.getElementById("eggsGood");
    this.badEl = document.getElementById("eggsBad");
    this.homeEl = document.getElementById("eggsHome");
    this.saveBtn = document.getElementById("saveEggBtn");
    this.infoBox = document.getElementById("eggsInfo");

    if (!this.saveBtn) {
      console.warn("❌ saveEggBtn не знайдена");
      return;
    }

    this.init();
  }

  init() {
    if (this.dateEl && !this.dateEl.value) {
      this.dateEl.value = new Date().toISOString().slice(0, 10);
    }

    this.saveBtn.addEventListener("click", () => this.handleSave());
  }

  handleSave() {
    const date = this.dateEl?.value;
    const good = Number(this.goodEl?.value || 0);
    const bad = Number(this.badEl?.value || 0);
    const home = Number(this.homeEl?.value || 0);

    // ❌ логічна помилка
    if (bad + home > good) {
      this.markError(true);
      if (this.infoBox) {
        this.infoBox.innerHTML = "❌ Брак + для дому > кількості яєць";
      }
      return;
    }

    this.markError(false);

    this.onSave({ date, good, bad, home });
  }

  markError(flag) {
    [this.badEl, this.homeEl].forEach(el => {
      if (!el) return;
      el.classList.toggle("input-error", flag);
    });
  }
};