// utils/validators.js

export function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function isPositiveNumber(v) {
  return Number(v) > 0;
}

export function markError(el, ms = 1200) {
  if (!el) return;
  el.classList.add("input-error");
  setTimeout(() => el.classList.remove("input-error"), ms);
}