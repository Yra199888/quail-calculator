/**
 * utils/validators.js
 * ---------------------------------------
 * Набір простих валідаторів для форм.
 * Використовується у контролерах перед записом у AppState.
 */

/**
 * Перевірка: чи значення є числом
 * @param {*} value
 * @returns {boolean}
 */
export function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Перевірка: чи можна привести до числа
 * @param {*} value
 * @returns {boolean}
 */
export function isNumeric(value) {
  return value !== null && value !== "" && !isNaN(Number(value));
}

/**
 * Перевірка: число >= 0
 * @param {*} value
 * @returns {boolean}
 */
export function isPositive(value) {
  return isNumeric(value) && Number(value) >= 0;
}

/**
 * Перевірка: рядок не порожній
 * @param {*} value
 * @returns {boolean}
 */
export function isNotEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Перевірка: валідна дата (YYYY-MM-DD)
 * @param {string} value
 * @returns {boolean}
 */
export function isValidDate(value) {
  if (!isNotEmpty(value)) return false;

  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Універсальна перевірка кількості (для яєць, корму, складу)
 * @param {*} value
 * @returns {number} безпечне число
 */
export function toSafeNumber(value) {
  if (!isNumeric(value)) return 0;
  return Number(value);
}