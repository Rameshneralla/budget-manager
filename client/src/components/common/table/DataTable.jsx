/**
 * Desktop / tablet table. Horizontally scrollable inside its panel so the
 * page itself never overflows.
 *
 * Column definition: { key, label, render(record), sortable?, className?, headerClassName? }
 * `groups` (optional): [{ label, records, total, isOpen, domId, ... }] renders an
 * accordion heading row with a subtotal per group, like the category sections of
 * the budget sheet; a group's rows show only while it is open (onToggleGroup).
 */
import SelectCheckbox from './SelectCheckbox';
import SortableHeader, { getAriaSort } from './SortableHeader';
import RowActions from './RowActions';
import GroupHeading from './GroupHeading';

export default function DataTable({
  caption,
  columns,
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
  function renderRow(record) {
    const recordLabel = getRecordLabel(record);
    const isSelected = selection.isSelected(record.id);
    return (
      <tr key={record.id} className={isSelected ? 'is-selected' : undefined}>
        <td className="col-select">
          <SelectCheckbox
            checked={isSelected}
            onChange={() => selection.toggle(record.id)}
            label={`Select ${recordLabel}`}
          />
        </td>
        {columns.map((column) => (
          <td key={column.key} className={column.className}>
            {column.render(record)}
          </td>
        ))}
        <td className="col-actions">
          <RowActions
            recordLabel={recordLabel}
            onEdit={() => onEdit(record)}
            onDelete={() => onDelete(record)}
          />
        </td>
      </tr>
    );
  }

  return (
    <div className="data-table-scroll">
      <table className="table data-table table-hover">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="col-select">
              <SelectCheckbox
                checked={selection.allSelected}
                indeterminate={selection.someSelected}
                onChange={selection.toggleAll}
                label="Select all records"
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.headerClassName}
                aria-sort={column.sortable ? getAriaSort(column.key, sort) : undefined}
              >
                {column.sortable ? (
                  <SortableHeader column={column} sort={sort} onSort={onSort} />
                ) : (
                  column.label
                )}
              </th>
            ))}
            <th scope="col" className="col-actions">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        {groups ? (
          groups.map((group) => (
            <tbody key={group.label} id={group.domId}>
              <tr className="group-row">
                <th scope="rowgroup" colSpan={columns.length + 2}>
                  <GroupHeading
                    group={group}
                    controlsId={group.domId}
                    onToggle={() => onToggleGroup(group.label)}
                  />
                </th>
              </tr>
              {group.isOpen && group.records.map(renderRow)}
            </tbody>
          ))
        ) : (
          <tbody>{records.map(renderRow)}</tbody>
        )}
      </table>
    </div>
  );
}
