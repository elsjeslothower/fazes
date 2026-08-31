// Android/desktop Chrome/Edge fire `beforeinstallprompt`, giving us a native
// install prompt we can trigger from our own UI. It can fire before any
// Preact component has mounted, so it's captured at module scope in a tiny
// pub-sub and exposed via a hook for whichever component wants to show an
// "Install app" button (there is no iOS equivalent — see ios-install-banner.js).
let deferredEvent = null;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener(deferredEvent !== null);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredEvent = event;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredEvent = null;
    notify();
  });
}

export function subscribeInstallAvailable(listener) {
  listeners.add(listener);
  listener(deferredEvent !== null);
  return () => listeners.delete(listener);
}

export async function promptInstall() {
  if (!deferredEvent) return null;
  const event = deferredEvent;
  deferredEvent = null;
  notify();
  event.prompt();
  return event.userChoice;
}
