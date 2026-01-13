/**
 * cages.service.js
 * ---------------------------------------
 * Бізнес-логіка кліток (БЕЗ DOM)
 */

import { AppState } from "../state/AppState.js";

function ensureCages() {
  AppState.cages ||= {};
  AppState.cages.list ||= [];
}

export function getCages() {
  ensureCages();
  return AppState.cages.list;
}

export function createCage({ name = "Клітка", tiers = 4 } = {}) {
  ensureCages();

  const cageId = `cage_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const tierList = Array.from({ length: Math.max(1, Number(tiers) || 4) }, (_, i) => ({
    id: `tier_${i + 1}`,
    index: i + 1,
    quails: 0,
    males: 0,
    females: 0
  }));

  const cage = {
    id: cageId,
    name: `${name} #${AppState.cages.list.length + 1}`,
    tiers: tierList,
    createdAt: new Date().toISOString()
  };

  AppState.cages.list.unshift(cage);
  return cage;
}

export function deleteCage(cageId) {
  ensureCages();
  AppState.cages.list = AppState.cages.list.filter(c => c.id !== cageId);
}

export function updateCageName(cageId, name) {
  ensureCages();
  const cage = AppState.cages.list.find(c => c.id === cageId);
  if (!cage) return;
  cage.name = String(name || "").trim() || cage.name;
}

export function updateTier(cageId, tierIndex, patch) {
  ensureCages();
  const cage = AppState.cages.list.find(c => c.id === cageId);
  if (!cage) return;

  const tier = cage.tiers?.find(t => t.index === Number(tierIndex));
  if (!tier) return;

  // safe numeric coercion
  const next = { ...patch };
  ["quails", "males", "females"].forEach(k => {
    if (k in next) {
      const v = Number(next[k]);
      next[k] = Number.isFinite(v) ? Math.max(0, v) : 0;
    }
  });

  Object.assign(tier, next);
}