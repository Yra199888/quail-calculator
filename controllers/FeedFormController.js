// ============================
// FeedFormController
// ВІДПОВІДАЄ ТІЛЬКИ ЗА ФОРМУ КАЛЬКУЛЯТОРА
// ============================

export class FeedFormController {
  constructor({ onChange }) {
    this.onChange = onChange;
    this.els = {};
  }

  init() {
    this.els = {
      qty: document.querySelectorAll(".qty"),
      price: document.querySelectorAll(".price"),
      volume: document.getElementById("feedVolume"),
    };

    this.bind();
    this.syncFromState();
  }

  bind() {
    this.els.qty.forEach((el, i) => {
      el.addEventListener("input", () => {
        this.onChange({
          type: "qty",
          index: i,
          value: Number(el.value) || 0
        });
      });
    });

    this.els.price.forEach((el, i) => {
      el.addEventListener("input", () => {
        this.onChange({
          type: "price",
          index: i,
          value: Number(el.value) || 0
        });
      });
    });

    if (this.els.volume) {
      this.els.volume.addEventListener("input", () => {
        this.onChange({
          type: "volume",
          value: Number(this.els.volume.value) || 0
        });
      });
    }
  }

  syncFromState() {
    if (!window.AppState?.feedCalculator) return;

    const { qty, price, volume } = AppState.feedCalculator;

    this.els.qty.forEach((el, i) => {
      el.value = qty[i] ?? el.value;
    });

    this.els.price.forEach((el, i) => {
      el.value = price[i] ?? el.value;
    });

    if (this.els.volume) {
      this.els.volume.value = volume ?? this.els.volume.value;
    }
  }
}