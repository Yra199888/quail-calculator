// ui/toast.js

export function toast(msg, type = "warn", ms = 2200) {
  const el = document.getElementById("toast");
  if (!el) {
    alert(msg);
    return;
  }

  el.className = `toast ${type} show`;
  el.textContent = msg;

  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), ms);
}

export function bindGlobalErrors() {
  window.onerror = function (msg, src, line, col) {
    console.error("JS error:", msg, src, line, col);
    toast(`Помилка: ${msg} (${line}:${col})`, "error", 4500);
  };
}