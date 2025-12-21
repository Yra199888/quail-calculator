// src/controllers/EggsFormController.js
import { recomputeEggs } from "../services/eggsService.js";
import { recomputeWarehouse } from "../services/warehouseService.js";
import { saveAppState } from "../storage/storage.js";

export class EggsFormController {
  constructor({ AppState, onUpdate }) {
    this.AppState = AppState;
    this.onUpdate = onUpdate;
  }

  save({ date, good, bad, home }) {
    this.AppState.eggs.records[date] = { good, bad, home };

    recomputeEggs(this.AppState);
    recomputeWarehouse(this.AppState);

    saveAppState(this.AppState);
    this.onUpdate?.();
  }

  delete(date) {
    delete this.AppState.eggs.records[date];

    recomputeEggs(this.AppState);
    recomputeWarehouse(this.AppState);

    saveAppState(this.AppState);
    this.onUpdate?.();
  }
}