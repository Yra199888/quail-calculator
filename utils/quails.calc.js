/**
 * utils/quails.calc.js
 * ---------------------------------------
 * Підрахунок загальної кількості перепілок з усіх кліток.
 * Без DOM. Без рендеру. Без побічних ефектів.
 */

import { AppState } from "../state/AppState.js";

/**
 * Повертає масив кліток з AppState у максимально сумісний спосіб
 * @returns {Array}
 */
function getCagesArray() {
  // варіанти, які часто зустрічаються в проектах
  const c1 = AppState?.cages?.list;
  if (Array.isArray(c1)) return c1;

  const c2 = AppState?.cages;
  if (Array.isArray(c2)) return c2;

  const c3 = AppState?.cages?.items;
  if (Array.isArray(c3)) return c3;

  return [];
}

/**
 * Безпечно дістає число
 */
function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

/**
 * Головна функція: загальна кількість перепілок по всіх клітках
 *
 * Підтримує:
 * - tier.quails
 * - або tier.males + tier.females
 *
 * @returns {number}
 */
export function getTotalQuails() {
  const cages = getCagesArray();

  let total = 0;

  for (const cage of cages) {
    const tiers = Array.isArray(cage?.tiers) ? cage.tiers : [];

    for (const tier of tiers) {
      // пріоритет: tier.quails
      const q = n(tier?.quails);

      if (q > 0) {
        total += q;
        continue;
      }

      // fallback: males + females
      total += n(tier?.males) + n(tier?.females);
    }
  }

  // захист від від’ємних/NaN
  return total > 0 ? total : 0;
}