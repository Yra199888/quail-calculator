// controllers/EggsFormController.js

export class EggsFormController {
  constructor({ onSave }) {
    if (typeof onSave !== "function") {
      throw new Error("EggsFormController: onSave callback is required");
    }

    this.onSave = onSave;

    // DOM
    this.dateEl = document.getElementById("eggsDate");
    this.goodEl = document.getElementById("eggsGood");
    this.badEl = document.getElementById("eggsBad");
    this.homeEl = document.getElementById("eggsHome");
    this.saveBtn = document.getElementById("saveEggBtn");
    this.infoBox = document.getElementById("eggsInfo");

    if (!this.dateEl || !this.goodEl || !this.badEl || !this.homeEl || !this.saveBtn) {
      throw new Error("EggsFormController: required form elements not found");
    }

    // state
    this.state = {
      date: "",
      good: 0,
      bad: 0,
      home: 0,
      editDate: null
    };

    this.bind();
    this.reset();
  }

  // =========================
  //  BIND EVENTS
  // =========================
  bind() {
    this.dateEl.addEventListener("input", e => {
      this.state.date = e.target.value;
    });

    this.goodEl.addEventListener("input", e => {
      this.state.good = Number(e.target.value) || 0;
    });

    this.badEl.addEventListener("input", e => {
      this.state.bad = Number(e.target.value) || 0;
    });

    this.homeEl.addEventListener("input", e => {
      this.state.home = Number(e.target.value) || 0;
    });

    this.saveBtn.addEventListener("click", () => {
      this.submit();
    });
  }

  // =========================
  //  VALIDATION
  // =========================
  validate() {
    const { good, bad, home } = this.state;

    if (bad + home > good) {
      return "❌ Брак + для дому не можуть перевищувати кількість яєць";
    }

    return null;
  }

  // =========================
  //  SUBMIT
  // =========================
  submit() {
    const error = this.validate();
    if (error) {
      this.showInfo(error, true);
      return;
    }

    const payload = {
      date: this.state.date,
      good: this.state.good,
      bad: this.state.bad,
      home: this.state.home,
      editDate: this.state.editDate
    };

    this.onSave(payload);
    this.reset();
  }

  // =========================
  //  EDIT MODE
  // =========================
  startEdit(date, record) {
    this.state = {
      date,
      good: Number(record.good) || 0,
      bad: Number(record.bad) || 0,
      home: Number(record.home) || 0,
      editDate: date
    };

    this.sync();
    this.showInfo(`✏️ Редагування запису ${date}`);
  }

  // =========================
  //  RESET
  // =========================
  reset() {
    this.state = {
      date: this.today(),
      good: 0,
      bad: 0,
      home: 0,
      editDate: null
    };

    this.sync();
    this.clearInfo();
  }

  // =========================
  //  SYNC STATE → DOM
  // =========================
  sync() {
    this.dateEl.value = this.state.date;
    this.goodEl.value = this.state.good || "";
    this.badEl.value = this.state.bad || "";
    this.homeEl.value = this.state.home || "";
  }

  // =========================
  //  INFO BOX
  // =========================
  showInfo(text, isError = false) {
    if (!this.infoBox) return;
    this.infoBox.innerHTML = text;
    this.infoBox.style.color = isError ? "#ff6b6b" : "#9ccc65";
  }

  clearInfo() {
    if (this.infoBox) this.infoBox.innerHTML = "";
  }

  // =========================
  //  UTILS
  // =========================
  today() {
    return new Date().toISOString().slice(0, 10);
  }
}