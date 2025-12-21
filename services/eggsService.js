// src/services/eggsService.js
import { sortDatesAsc } from "../utils/dates.js";

export function recomputeEggs(AppState) {
  const records = AppState.eggs.records;
  const dates = sortDatesAsc(Object.keys(records));

  let carry = 0;
  let totalTrays = 0;

  dates.forEach(date => {
    const e = records[date];

    const good = Number(e.good) || 0;
    const bad  = Number(e.bad)  || 0;
    const home = Number(e.home) || 0;

    const commercial = Math.max(good - bad - home, 0);
    const sum = carry + commercial;

    const trays = Math.floor(sum / 20);
    const remainder = sum % 20;

    e.commercial = commercial;
    e.carryIn = carry;
    e.sum = sum;
    e.trays = trays;
    e.remainder = remainder;

    totalTrays += trays;
    carry = remainder;
  });

  AppState.eggs.carry = carry;
  AppState.eggs.totalTrays = totalTrays;
}