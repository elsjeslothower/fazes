// A thin localStorage cache so the dashboard can render instantly (and work
// offline) with the last-known data while a fresh copy loads from Supabase
// in the background. This is a backup/restore-style cache for a single
// active device, not a sync engine — the network copy always wins once it
// arrives (see cycleStore.js).
const CYCLES_KEY = 'fazes-cached-cycles';
const PROFILE_KEY = 'fazes-cached-profile';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or unavailable (e.g. private browsing) — the app
    // still works, just without the instant-load cache.
  }
}

export function loadCachedCycles() {
  return read(CYCLES_KEY);
}

export function saveCachedCycles(cycles) {
  write(CYCLES_KEY, cycles);
}

export function loadCachedProfile() {
  return read(PROFILE_KEY);
}

export function saveCachedProfile(profile) {
  write(PROFILE_KEY, profile);
}

export function clearCache() {
  localStorage.removeItem(CYCLES_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
