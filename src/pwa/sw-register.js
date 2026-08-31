// Registers the service worker and surfaces "new version available" as a callback,
// so app.jsx can decide how to present the update. Kept DOM/Preact-free on purpose —
// this is exactly the kind of platform wiring that gets swapped for a Capacitor
// equivalent later, so it stays isolated in its own module.
export function registerServiceWorker({ onUpdateAvailable } = {}) {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // No /sw.js exists under `vite dev` (it's only emitted by `vite build`), so
  // skip registration there entirely — verify the offline/update flow against
  // `npm run build && npm run preview` instead.
  if (import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { type: 'module' });

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateAvailable?.(registration);
          }
        });
      });
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  });

  // Reload once the new service worker takes control, so the update actually applies.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

export function activateWaitingServiceWorker(registration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}
