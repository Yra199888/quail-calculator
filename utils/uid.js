/**
 * utils/uid.js
 * ---------------------------------------
 * Генерація унікальних ідентифікаторів.
 * Використовується для:
 *  - записів яєць
 *  - замовлень
 *  - рецептів
 *  - історії замісів
 */

/**
 * Генерує унікальний ID
 * Формат: <timestamp>_<random>
 * Приклад: 1712345678901_a3f9c1
 * @returns {string}
 */
export function uid() {
  return (
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

/**
 * Генерує короткий ID (для UI, якщо потрібно)
 * @returns {string}
 */
export function shortUid() {
  return Math.random().toString(36).slice(2, 7);
}