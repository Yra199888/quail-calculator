// ============================
// OrdersFormController
// ВІДПОВІДАЄ ТІЛЬКИ ЗА ФОРМУ
// ============================

const OrdersFormController = {
  els: {},

  init() {
    this.els = {
      date: document.getElementById("orderDate"),
      client: document.getElementById("orderClient"),
      trays: document.getElementById("orderTrays"),
      details: document.getElementById("orderDetails"),
      submit: document.getElementById("addOrderBtn"),
    };

    if (this.els.submit) {
      this.els.submit.addEventListener("click", () => {
        this.handleSubmit();
      });
    }

    // дата за замовчуванням
    if (this.els.date && !this.els.date.value) {
      this.els.date.value = new Date().toISOString().slice(0, 10);
    }
  },

  read() {
    return {
      date: this.els.date?.value || new Date().toISOString().slice(0, 10),
      client: (this.els.client?.value || "").trim(),
      trays: Number(this.els.trays?.value || 0),
      details: (this.els.details?.value || "").trim(),
    };
  },

  validate(data) {
    if (!data.client) {
      alert("Вкажи клієнта");
      return false;
    }
    if (data.trays <= 0) {
      alert("Вкажи кількість лотків (>0)");
      return false;
    }
    return true;
  },

  clear() {
    if (this.els.client) this.els.client.value = "";
    if (this.els.trays) this.els.trays.value = "";
    if (this.els.details) this.els.details.value = "";
  },

  handleSubmit() {
    const data = this.read();
    if (!this.validate(data)) return;

    // 🔒 ТУТ МИ ПОКИ НІЧОГО НЕ МІНЯЄМО
    // просто викликаємо стару перевірену логіку
    addOrderFromForm(data);

    this.clear();
  }
};

window.OrdersFormController = OrdersFormController;