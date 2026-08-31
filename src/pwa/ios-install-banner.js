// iOS Safari has never implemented `beforeinstallprompt` — there is no
// programmatic install prompt there, so this shows a manual Share-sheet
// instruction banner instead. It targets the static DOM nodes declared in
// index.html directly rather than going through Preact, since it's simple,
// independent overlay UI with no shared state to justify a component.
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari's legacy flag
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    // iPadOS 13+ reports as "Macintosh" but has touch support, unlike a real Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function initIosInstallBanner() {
  if (isStandalone() || !isIos()) return;

  const banner = document.getElementById('ios-install-banner');
  const dismissButton = document.getElementById('ios-install-dismiss');
  if (!banner || !dismissButton) return;

  const dismissedAt = localStorage.getItem('ios-install-dismissed-at');
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const recentlyDismissed = dismissedAt && Date.now() - Number(dismissedAt) < oneWeekMs;

  if (!recentlyDismissed) {
    banner.hidden = false;
  }

  dismissButton.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('ios-install-dismissed-at', String(Date.now()));
  });
}
