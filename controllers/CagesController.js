/**
 * CagesController.js
 * ---------------------------------------
 * Делегація подій для вкладки "Клітки"
 */

import { AppState } from "../state/AppState.js";
import { qs } from "../utils/dom.js";
import { createCage, deleteCage, updateCageName, updateTier } from "../services/cages.service.js";

export class CagesController {
  constructor({ saveState, onChange }) {
    this.saveState = saveState;
    this.onChange = onChange;

    this.bind();
  }

  bind() {
    document.addEventListener("click", (e) => {
      // add cage
      const addBtn = e.target.closest("#cage-add-btn");
      if (addBtn) {
        const cage = createCage({ name: "Клітка", tiers: 4 });

        AppState.ui ||= {};
        AppState.ui.cages ||= {};
        AppState.ui.cages.selectedId = cage.id;

        this.saveState?.();
        this.onChange?.();
        return;
      }

      // open cage
      const openBtn = e.target.closest("[data-cage-open]");
      if (openBtn) {
        const id = openBtn.dataset.cageOpen;
        AppState.ui ||= {};
        AppState.ui.cages ||= {};
        AppState.ui.cages.selectedId = id;

        this.saveState?.();
        this.onChange?.();
        return;
      }

      // delete cage
      const delBtn = e.target.closest("[data-cage-delete]");
      if (delBtn) {
        const id = delBtn.dataset.cageDelete;
        if (!id) return;
        if (!confirm("Видалити цю клітку?")) return;

        deleteCage(id);

        // якщо видалили обрану — вибираємо першу
        const first = AppState.cages?.list?.[0]?.id ?? null;
        AppState.ui ||= {};
        AppState.ui.cages ||= {};
        AppState.ui.cages.selectedId = first;

        this.saveState?.();
        this.onChange?.();
        return;
      }
    });

    document.addEventListener("input", (e) => {
      // cage name
      const nameInput = e.target.closest("[data-cage-name]");
      if (nameInput) {
        const id = nameInput.dataset.cageName;
        updateCageName(id, nameInput.value);

        this.saveState?.();
        this.onChange?.();
        return;
      }

      // tier fields
      const tierInput = e.target.closest("[data-tier-field]");
      if (tierInput) {
        const cageId = tierInput.dataset.cageId;
        const tierIndex = Number(tierInput.dataset.tierIndex);
        const field = tierInput.dataset.tierField;
        const value = Number(tierInput.value || 0);

        updateTier(cageId, tierIndex, { [field]: value });

        this.saveState?.();
        this.onChange?.();
        return;
      }
    });
  }
}