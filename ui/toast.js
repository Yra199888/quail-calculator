/**
 * toast.js
 * ---------------------------------------
 * Універсальні toast-повідомлення для UI.
 * Використовується для:
 *  - попереджень
 *  - помилок
 *  - успішних дій
 *
 * Без бізнес-логіки.
 * Працює напряму з DOM.
 */

/**
 * Показати toast-повідомлення
 * @param {string} message - текст повідомлення
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {number} duration - тривалість показу (мс)
 */
export function showToast(message, type = "info", duration = 2500) {
  const container = getToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // анімація появи
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // автоматичне закриття
  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Отримати або створити контейнер для toast
 */
function getToastContainer() {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  return container;
}