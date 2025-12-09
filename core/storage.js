import { DATA } from "./data.js";

export function saveLocal() {
    localStorage.setItem("quail_data", JSON.stringify(DATA));
}

export function loadLocal() {
    const raw = localStorage.getItem("quail_data");
    if (raw) {
        Object.assign(DATA, JSON.parse(raw));
    }
}