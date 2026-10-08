/** Appears when records are selected: change status of all / delete all / clear selection. */
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import { FiTrash2, FiX } from 'react-icons/fi';
import { getStatusAppearance } from '../StatusBadge';

export default function BulkActionsBar({
  selectedCount,
  statuses,
  onChangeStatus,
  onDelete,
  onClear,
}) {
  return (
    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <span className="bulk-bar__count" aria-live="polite">
        Selected: {selectedCount}
      </span>
      <div className="bulk-bar__actions">
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm" id="bulk-status-toggle">
            Change Status
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {statuses.map((status) => {
              const { icon: Icon } = getStatusAppearance(status);
              return (
                <Dropdown.Item
                  key={status}
                  as="button"
                  type="button"
                  onClick={() => onChangeStatus(status)}
                >
                  <Icon aria-hidden="true" className="me-2" />
                  Mark as {status}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
        <Button variant="outline-danger" size="sm" onClick={onDelete}>
          <FiTrash2 aria-hidden="true" /> Delete Selected
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <FiX aria-hidden="true" /> Clear
        </Button>
      </div>
    </div>
  );
}
