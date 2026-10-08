/**
 * Loads data from an API call and tracks loading / error state.
 *
 *   const { data, isLoading, error, reload } = useApiData(
 *     () => incomeService.listByMonth(month),
 *     [month, dataVersion]
 *   );
 *
 * The request re-runs whenever a value in `dependencies` changes. Responses
 * that arrive after a newer request started are ignored.
 */
import { useCallback, useEffect, useState } from 'react';

export function useApiData(fetchData, dependencies, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    fetchData()
      .then((result) => isCurrent && setData(result))
      .catch((requestError) => isCurrent && setError(requestError))
      .finally(() => isCurrent && setIsLoading(false));

    return () => {
      isCurrent = false;
    };
    // `fetchData` is usually an inline arrow; callers list its inputs in `dependencies`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadCount, ...dependencies]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, isLoading, error, reload };
}
