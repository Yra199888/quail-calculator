/**
 * CagesController.js
 * ---------------------------------------
 * Делегація подій для вкладки "Клітки"
 * + видалення клітки
 * + заборона видалення, якщо клітка не порожня
 * + підтвердження дії
 */

import { AppState } from "../state/AppState.js";
import {
  createCage,
  deleteCage,
  updateCageName,
  updateTier
} from "../services/cages.service.js";

export class CagesController {
  constructor({ saveState, onChange }) {
    this.saveState = saveState;
    this.onChange = onChange;

    this.bind();
  }

  /* =========================
     БЕЗПЕЧНА ІНІЦІАЛІЗАЦІЯ UI
  ========================= */

  ensureUI() {
    if (!AppState.ui) AppState.ui = {};
    if (!AppState.ui.cages) AppState.ui.cages = {};
  }

  /* =========================
     ПРИВʼЯЗКА ПОДІЙ
  ========================= */

  bind() {
    document.addEventListener("click", (e) => {
      this.ensureUI();

      /* ===== ДОДАТИ КЛІТКУ ===== */
      const addBtn = e.target.closest("#cage-add-btn");
      if (addBtn) {
        const cage = createCage({ name: "Клітка", tiers: 4 });
        AppState.ui.cages.selectedId = cage.id;

        this.commit();
        return;
      }

      /* ===== ВІДКРИТИ КЛІТКУ ===== */
      const openBtn = e.target.closest("[data-cage-open]");
      if (openBtn) {
        const id = openBtn.dataset.cageOpen;

        if (AppState.ui.cages.selectedId !== id) {
          AppState.ui.cages.selectedId = id;
          this.commit();
        }
        return;
      }

      /* ===== ВИДАЛИТИ КЛІТКУ ===== */
      const delBtn = e.target.closest("[data-cage-delete]");
      if (delBtn) {
        const cageId = delBtn.dataset.cageDelete;
        if (!cageId) return;

        const cage = AppState.cages?.list?.find(c => c.id === cageId);
        if (!cage) return;

        // ❌ Заборона видалення, якщо є перепілки
        const hasQuails = cage.tiers?.some(t => Number(t.quails) > 0);
        if (hasQuails) {
          alert("Не можна видалити клітку, в якій є перепілки.");
          return;
        }

        // ✅ Підтвердження
        const ok = confirm("Ви дійсно хочете видалити цю клітку?");
        if (!ok) return;

        deleteCage(cageId);

        // якщо видалили обрану — вибираємо першу клітку
        AppState.ui.cages.selectedId =
          AppState.cages?.list?.[0]?.id ?? null;

        this.commit();
        return;
      }
    });

    document.addEventListener("input", (e) => {
      this.ensureUI();

      /* ===== НАЗВА КЛІТКИ ===== */
      const nameInput = e.target.closest("[data-cage-name]");
      if (nameInput) {
        updateCageName(
          nameInput.dataset.cageName,
          nameInput.value
        );

        this.commit();
        return;
      }

      /* ===== ПОЛЯ ЯРУСУ ===== */
      const tierInput = e.target.closest("[data-tier-field]");
      if (tierInput) {
        updateTier(
          tierInput.dataset.cageId,
          Number(tierInput.dataset.tierIndex),
          {
            [tierInput.dataset.tierField]:
              Number(tierInput.value || 0)
          }
        );

        this.commit();
      }
    });
  }

  /* =========================
     ФІКСАЦІЯ ЗМІН
  ========================= */

  commit() {
    this.saveState?.();
    this.onChange?.();
  }
}