import { createStore } from './createStore.js';
import * as cyclesRepo from '../data/cyclesRepo.js';
import * as profileRepo from '../data/profileRepo.js';
import {
  loadCachedCycles,
  saveCachedCycles,
  loadCachedProfile,
  saveCachedProfile,
  clearCache,
} from '../data/localCache.js';
import { getCycleStatus, formatDateOnly } from '../cycle/phaseEngine.js';

const store = createStore({
  cycles: loadCachedCycles() ?? [],
  profile: loadCachedProfile() ?? null,
  loading: true,
});

export const useCycleStore = store.useStore;

// Loads the cached copy immediately (already done at module init above), then
// reconciles with Supabase. This is a backup/restore model, not live sync —
// the network response always replaces local state once it lands.
export async function loadForUser(userId) {
  store.setState({ loading: true });
  const [cycles, profile] = await Promise.all([
    cyclesRepo.listCycles(userId),
    profileRepo.getOrCreateProfile(userId),
  ]);
  saveCachedCycles(cycles);
  saveCachedProfile(profile);
  store.setState({ cycles, profile, loading: false });
}

export function clearOnSignOut() {
  clearCache();
  store.setState({ cycles: [], profile: null, loading: true });
}

export async function logPeriodStart(userId, startDate = formatDateOnly(new Date())) {
  const cycle = await cyclesRepo.startCycle(userId, startDate);
  const cycles = [cycle, ...store.getState().cycles];
  saveCachedCycles(cycles);
  store.setState({ cycles });
  return cycle;
}

export async function logPeriodEnd(cycleId, endDate = formatDateOnly(new Date())) {
  const updated = await cyclesRepo.endCycle(cycleId, endDate);
  const cycles = store.getState().cycles.map((c) => (c.id === cycleId ? updated : c));
  saveCachedCycles(cycles);
  store.setState({ cycles });
  return updated;
}

export async function editCycle(cycleId, dates) {
  const updated = await cyclesRepo.updateCycle(cycleId, dates);
  const cycles = store.getState().cycles.map((c) => (c.id === cycleId ? updated : c));
  saveCachedCycles(cycles);
  store.setState({ cycles });
  return updated;
}

export async function removeCycle(cycleId) {
  await cyclesRepo.deleteCycle(cycleId);
  const cycles = store.getState().cycles.filter((c) => c.id !== cycleId);
  saveCachedCycles(cycles);
  store.setState({ cycles });
}

export async function saveSettings(userId, settings) {
  const profile = await profileRepo.updateProfile(userId, settings);
  saveCachedProfile(profile);
  store.setState({ profile });
  return profile;
}

export function currentStatus() {
  const { cycles, profile } = store.getState();
  return getCycleStatus({ cycles, settings: profile ?? undefined });
}
