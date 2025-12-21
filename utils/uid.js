// src/utils/uid.js

export function uid(prefix = "") {
  return (
    prefix +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}