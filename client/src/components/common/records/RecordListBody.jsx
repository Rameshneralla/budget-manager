/** Chooses what the records panel shows: loading, error, empty, no matches, table or cards. */
import Button from 'react-bootstrap/Button';
import { FiPlus, FiSearch } from 'react-icons/fi';
import DataTable from '../table/DataTable';
import RecordCardList from '../table/RecordCardList';
import { EmptyState, ErrorState, LoadingState } from '../StateBlocks';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MOBILE_MEDIA_QUERY } from '../../../constants';

export default function RecordListBody({
  config,
  monthLabel,
  isLoading,
  error,
  onRetry,
  totalRecords,
  table,
  columns,
  groups,
  onToggleGroup,
  selection,
  onAdd,
  onEdit,
  onDelete,
}) {
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

  if (isLoading && totalRecords === 0) {
    return <LoadingState message={`Loading ${config.pluralLabel}...`} />;
  }
  if (error) {
    return (
      <ErrorState
        title={`Unable to load ${config.pluralLabel}. Please try again.`}
        message={error.message}
        onRetry={onRetry}
      />
    );
  }
  if (totalRecords === 0) {
    return (
      <EmptyState
        title={config.emptyTitle(monthLabel)}
        message={config.emptyMessage}
        action={
          <Button variant="primary" onClick={onAdd}>
            <FiPlus aria-hidden="true" /> {config.addLabel}
          </Button>
        }
      />
    );
  }
  if (table.filteredRecords.length === 0) {
    return (
      <EmptyState
        icon={FiSearch}
        title="No matching records"
        message="Try a different search or clear the filters."
        action={
          <Button variant="outline-secondary" onClick={table.resetFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  const listProps = {
    columns,
    records: table.pageRecords,
    groups,
    onToggleGroup,
    sort: table.sort,
    onSort: table.toggleSort,
    selection,
    getRecordLabel: config.describe,
    onEdit,
    onDelete,
  };

  return isMobile ? (
    <RecordCardList {...listProps} card={config.card} />
  ) : (
    <DataTable {...listProps} caption={`${config.title} for ${monthLabel}`} />
  );
}
