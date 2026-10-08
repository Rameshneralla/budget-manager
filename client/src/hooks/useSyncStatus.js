/**
 * Live sync status for the header indicator and the Settings card.
 * Returns null outside the GitHub Pages build (sync does not apply there).
 */
import { useCallback, useEffect, useState } from 'react';
import { IS_LOCAL_MODE } from '../constants/appMode';
import { SYNC_EVENTS } from '../constants/syncEvents';
import { syncService } from '../services/syncService';

export function useSyncStatus() {
  const [status, setStatus] = useState(null);

  const refresh = useCallback(() => {
    if (!IS_LOCAL_MODE) {
      return Promise.resolve(null);
    }
    return syncService
      .getStatus()
      .then((latest) => {
        setStatus(latest);
        return latest;
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!IS_LOCAL_MODE) {
      return undefined;
    }
    refresh();
    const handleStatus = (event) => setStatus(event.detail);
    window.addEventListener(SYNC_EVENTS.STATUS_CHANGED, handleStatus);
    return () => window.removeEventListener(SYNC_EVENTS.STATUS_CHANGED, handleStatus);
  }, [refresh]);

  return { status, setStatus, refresh };
}
