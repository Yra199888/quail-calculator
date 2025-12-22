/**
 * utils/dom.js
 * ---------------------------------------
 * Утиліти для роботи з DOM.
 * ТУТ НЕМАЄ бізнес-логіки.
 * Лише спрощення доступу до елементів.
 */

/**
 * Швидкий доступ до елемента по ID
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function $(id) {
  return document.getElementById(id);
}

/**
 * Пошук одного елемента по CSS-селектору
 * @param {string} selector
 * @param {HTMLElement|Document} scope
 * @returns {Element|null}
 */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Пошук всіх елементів по CSS-селектору
 * @param {string} selector
 * @param {HTMLElement|Document} scope
 * @returns {Element[]}
 */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}