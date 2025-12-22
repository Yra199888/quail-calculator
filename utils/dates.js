/**
 * utils/dates.js
 * ---------------------------------------
 * Утиліти для роботи з датами.
 * Без привʼязки до AppState чи UI.
 */

/**
 * Повертає сьогоднішню дату у форматі YYYY-MM-DD
 * (зручно для input[type="date"])
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Перевіряє, чи рядок є валідною датою формату YYYY-MM-DD
 * @param {string} value
 * @returns {boolean}
 */
export function isValidISODate(value) {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Сортує масив ISO-дат по зростанню
 * @param {string[]} dates
 * @returns {string[]}
 */
export function sortDatesAsc(dates) {
  return [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Сортує масив ISO-дат по спаданню
 * @param {string[]} dates
 * @returns {string[]}
 */
export function sortDatesDesc(dates) {
  return [...dates].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
}

/**
 * Форматує ISO-дату у локальний вигляд
 * (для відображення користувачу)
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDateLocal(isoDate) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString();
}