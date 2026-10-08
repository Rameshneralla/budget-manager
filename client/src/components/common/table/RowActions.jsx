/** Edit / delete icon buttons for one record. */
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function RowActions({ recordLabel, onEdit, onDelete }) {
  return (
    <div className="d-inline-flex gap-1">
      <button
        type="button"
        className="icon-button"
        onClick={onEdit}
        aria-label={`Edit ${recordLabel}`}
        title="Edit"
      >
        <FiEdit2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button icon-button--danger"
        onClick={onDelete}
        aria-label={`Delete ${recordLabel}`}
        title="Delete"
      >
        <FiTrash2 aria-hidden="true" />
      </button>
    </div>
  );
}
