/**
 * Row selection for bulk actions. Selected ids that are no longer in
 * `availableIds` (deleted, filtered out, month changed) are dropped automatically.
 */
import { useCallback, useMemo, useState } from 'react';

export function useSelection(availableIds) {
  const [rawSelectedIds, setRawSelectedIds] = useState(() => new Set());

  const selectedIds = useMemo(() => {
    const available = new Set(availableIds);
    return new Set([...rawSelectedIds].filter((id) => available.has(id)));
  }, [rawSelectedIds, availableIds]);

  const toggle = useCallback((id) => {
    setRawSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allSelected = availableIds.length > 0 && selectedIds.size === availableIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    setRawSelectedIds(allSelected ? new Set() : new Set(availableIds));
  }, [allSelected, availableIds]);

  const clear = useCallback(() => setRawSelectedIds(new Set()), []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected: (id) => selectedIds.has(id),
    toggle,
    toggleAll,
    allSelected,
    someSelected,
    clear,
  };
}
