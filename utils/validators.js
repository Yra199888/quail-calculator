// src/utils/validators.js

export function required(value) {
  return value != null && String(value).trim().length > 0;
}

export function positiveNumber(n) {
  return Number(n) > 0;
}

export function nonNegativeNumber(n) {
  return Number(n) >= 0;
}

export function inRange(n, min, max) {
  const v = Number(n);
  return v >= min && v <= max;
}