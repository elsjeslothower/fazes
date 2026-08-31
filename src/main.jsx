import { render } from 'preact';
import { App } from './app.jsx';
import { initSession } from './state/session.js';
import { registerServiceWorker, activateWaitingServiceWorker } from './pwa/sw-register.js';
import { initIosInstallBanner } from './pwa/ios-install-banner.js';
import './styles.css';

initSession();
initIosInstallBanner();

registerServiceWorker({
  onUpdateAvailable(registration) {
    const toast = document.getElementById('update-toast');
    const reloadButton = document.getElementById('update-reload');
    if (!toast || !reloadButton) return;
    toast.hidden = false;
    reloadButton.addEventListener('click', () => activateWaitingServiceWorker(registration));
  },
});

render(<App />, document.getElementById('app'));
