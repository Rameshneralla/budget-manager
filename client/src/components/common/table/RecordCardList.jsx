/**
 * Mobile view of a records table: one card per record.
 *
 * card config: { title(record), subtitle(record), amount(record) }
 * Columns with `showInCard: true` are listed as label/value details.
 * The status column (key 'status') appears in the card footer.
 * `groups` (optional): accordion sections with a subtotal heading (see DataTable).
 */
import Form from 'react-bootstrap/Form';
import SelectCheckbox from './SelectCheckbox';
import RowActions from './RowActions';
import GroupHeading from './GroupHeading';
import { SORT_DIRECTIONS } from '../../../constants';

function MobileSortControl({ columns, sort, onSort }) {
  const sortableColumns = columns.filter((column) => column.sortable);
  const directionLabel = sort.direction === SORT_DIRECTIONS.ASC ? 'Ascending' : 'Descending';

  return (
    <div className="d-flex align-items-center gap-2 ms-auto">
      <Form.Label htmlFor="mobile-sort" className="mb-0 visually-hidden">
        Sort by
      </Form.Label>
      <Form.Select
        id="mobile-sort"
        size="sm"
        value={sort.key}
        onChange={(event) => onSort(event.target.value)}
      >
        {sortableColumns.map((column) => (
          <option key={column.key} value={column.key}>
            Sort: {column.label}
          </option>
        ))}
      </Form.Select>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => onSort(sort.key)}
        aria-label={`Sort direction: ${directionLabel}. Toggle`}
      >
        {sort.direction === SORT_DIRECTIONS.ASC ? '↑' : '↓'}
      </button>
    </div>
  );
}

export default function RecordCardList({
  columns,
  card,
  records,
  groups,
  onToggleGroup,
  sort,
  onSort,
  selection,
  getRecordLabel,
  onEdit,
  onDelete,
}) {
  const detailColumns = columns.filter((column) => column.showInCard);
  const statusColumn = columns.find((column) => column.key === 'status');

  function renderCard(record) {
    const recordLabel = getRecordLabel(record);
    const isSelected = selection.isSelected(record.id);
    return (
      <li key={record.id} className={`record-card${isSelected ? ' is-selected' : ''}`}>
        <SelectCheckbox
          checked={isSelected}
          onChange={() => selection.toggle(record.id)}
          label={`Select ${recordLabel}`}
        />
        <div className="min-w-0">
          <div className="record-card__header">
            <div className="min-w-0">
              <h3 className="record-card__title">{card.title(record)}</h3>
              <p className="record-card__subtitle">{card.subtitle(record)}</p>
            </div>
            <span className="record-card__amount amount">{card.amount(record)}</span>
          </div>

          {detailColumns.length > 0 && (
            <dl className="record-card__details">
              {detailColumns.map((column) => (
                <div key={column.key}>
                  <dt>{column.label}</dt>
                  <dd>{column.render(record)}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="record-card__footer">
            {statusColumn?.render(record)}
            <RowActions
              recordLabel={recordLabel}
              onEdit={() => onEdit(record)}
              onDelete={() => onDelete(record)}
            />
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <div className="select-all-row">
        <SelectCheckbox
          id="mobile-select-all"
          checked={selection.allSelected}
          indeterminate={selection.someSelected}
          onChange={selection.toggleAll}
          label="Select all records"
        />
        <label htmlFor="mobile-select-all" className="mb-0">
          Select all
        </label>
        <MobileSortControl columns={columns} sort={sort} onSort={onSort} />
      </div>

      {groups ? (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <div className="group-row group-row--card">
              <GroupHeading
                group={group}
                controlsId={group.domId}
                onToggle={() => onToggleGroup(group.label)}
              />
            </div>
            {group.isOpen && (
              <ul className="record-cards" id={group.domId}>
                {group.records.map(renderCard)}
              </ul>
            )}
          </section>
        ))
      ) : (
        <ul className="record-cards">{records.map(renderCard)}</ul>
      )}
    </>
  );
}
