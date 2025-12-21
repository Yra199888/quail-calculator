// utils/dates.js

export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function sortDatesAsc(dates = []) {
  return [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}