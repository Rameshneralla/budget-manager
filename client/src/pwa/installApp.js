/**
 * "Install the app" support (Progressive Web App).
 *
 * - Chrome / Edge / Samsung Internet (Android, Windows, macOS, ChromeOS) fire
 *   `beforeinstallprompt`; we keep that event and show our own Install button.
 * - iPhone / iPad Safari has no install event: users tap Share > Add to Home
 *   Screen, so we show those steps instead.
 *
 * Started from main.jsx before React renders, so the early browser event is never missed.
 */
let deferredInstallEvent = null;
let isInstalled = false;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function isRunningAsInstalledApp() {
  return (
    isInstalled ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isAppleMobileDevice() {
  const { userAgent, platform, maxTouchPoints } = window.navigator;
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  return /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export function startInstallSupport() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // we show our own Install button instead of the mini-infobar
    deferredInstallEvent = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    deferredInstallEvent = null;
    notify();
  });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('Offline support / install is unavailable:', error.message);
    });
  });
}

/** For useSyncExternalStore. */
export function subscribeToInstallState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 'prompt' (one-click install), 'ios' (manual steps), or null (not available / already installed). */
export function getInstallMode() {
  if (isRunningAsInstalledApp()) {
    return null;
  }
  if (deferredInstallEvent) {
    return 'prompt';
  }
  return isAppleMobileDevice() ? 'ios' : null;
}

/** Opens the browser's install dialog. Resolves to true when the user accepts. */
export async function promptInstall() {
  if (!deferredInstallEvent) {
    return false;
  }
  const installEvent = deferredInstallEvent;
  deferredInstallEvent = null; // the event can only be used once
  notify();
  await installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  return outcome === 'accepted';
}
