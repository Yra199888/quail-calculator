// src/utils/dates.js

export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function sortDatesAsc(dates) {
  return dates.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}