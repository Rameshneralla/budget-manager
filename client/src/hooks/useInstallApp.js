/**
 * Install state for components:
 *   installMode  'prompt' | 'ios' | null  (see pwa/installApp.js)
 *   install()    opens the browser's install dialog (installMode 'prompt')
 */
import { useSyncExternalStore } from 'react';
import { getInstallMode, promptInstall, subscribeToInstallState } from '../pwa/installApp';

export function useInstallApp() {
  const installMode = useSyncExternalStore(subscribeToInstallState, getInstallMode);
  return { installMode, install: promptInstall };
}
