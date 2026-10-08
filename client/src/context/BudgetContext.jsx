/**
 * App-wide budget state shared by every page:
 *
 *   meta            owner, categories, payment methods, statuses, expense types (GET /api/meta)
 *   months          months that have data, from the database (GET /api/months)
 *   selectedMonth   the month every page is showing, e.g. '2026-10'
 *   dataVersion     increases after every change; data hooks re-fetch when it changes
 *   notifyDataChanged()  call after any create / update / delete / status change
 *
 * Keeping this here avoids passing the month and lookups through every component.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { referenceService } from '../services/referenceService';
import { MONTH_STORAGE_KEY } from '../constants';
import { SYNC_EVENTS } from '../constants/syncEvents';
import { readPreference, writePreference } from '../utils/browserStorage';
import { getCurrentMonthKey, pickInitialMonth } from '../utils/months';

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonthState] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Initial load: lookups + months.
  useEffect(() => {
    let isCurrent = true;
    setLoadError(null);

    Promise.all([referenceService.getMeta(), referenceService.getMonths()])
      .then(([loadedMeta, loadedMonths]) => {
        if (!isCurrent) {
          return;
        }
        setMeta(loadedMeta);
        setMonths(loadedMonths);
        setSelectedMonthState(pickInitialMonth(loadedMonths, readPreference(MONTH_STORAGE_KEY)));
      })
      .catch((error) => isCurrent && setLoadError(error));

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  // After a change the month list may grow (record saved in a new month) or
  // shrink (last record of a month deleted), so refresh it.
  useEffect(() => {
    if (dataVersion === 0) {
      return undefined;
    }
    let isCurrent = true;
    referenceService
      .getMonths()
      .then((loadedMonths) => {
        if (!isCurrent) {
          return;
        }
        setMonths(loadedMonths);
        setSelectedMonthState((current) =>
          loadedMonths.length === 0 || loadedMonths.includes(current)
            ? current
            : pickInitialMonth(loadedMonths, null)
        );
      })
      .catch(() => {
        // Keep the current list; the page that triggered the change shows its own errors.
      });
    return () => {
      isCurrent = false;
    };
  }, [dataVersion]);

  const setSelectedMonth = useCallback((monthKey) => {
    setSelectedMonthState(monthKey);
    writePreference(MONTH_STORAGE_KEY, monthKey);
  }, []);

  const notifyDataChanged = useCallback(() => setDataVersion((version) => version + 1), []);

  // GitHub Pages build: data synced from another device replaced this device's data.
  useEffect(() => {
    window.addEventListener(SYNC_EVENTS.DATA_REPLACED, notifyDataChanged);
    return () => window.removeEventListener(SYNC_EVENTS.DATA_REPLACED, notifyDataChanged);
  }, [notifyDataChanged]);
  const retryLoad = useCallback(() => setLoadAttempt((attempt) => attempt + 1), []);

  // An empty database still needs one month to work in (the current month).
  const availableMonths = useMemo(
    () => (months.length > 0 ? months : [selectedMonth || getCurrentMonthKey()]),
    [months, selectedMonth]
  );

  const value = useMemo(
    () => ({
      meta,
      availableMonths,
      selectedMonth,
      setSelectedMonth,
      dataVersion,
      notifyDataChanged,
      isReady: Boolean(meta && selectedMonth),
      loadError,
      retryLoad,
    }),
    [
      meta,
      availableMonths,
      selectedMonth,
      setSelectedMonth,
      dataVersion,
      notifyDataChanged,
      loadError,
      retryLoad,
    ]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used inside <BudgetProvider>.');
  }
  return context;
}
