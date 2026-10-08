/** Accessible confirmation modal for destructive actions (delete, bulk delete, import). */
import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({
  show,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) {
  const [isWorking, setIsWorking] = useState(false);

  async function handleConfirm() {
    setIsWorking(true);
    try {
      await onConfirm();
    } catch {
      // The action already showed an error toast; keep the dialog open so the user can retry.
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Modal
      show={show}
      onHide={isWorking ? undefined : onCancel}
      centered
      aria-labelledby="confirm-dialog-title"
    >
      <Modal.Header closeButton={!isWorking}>
        <Modal.Title id="confirm-dialog-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex gap-3 align-items-start">
        <span className="confirm-dialog__icon tone-negative" aria-hidden="true">
          <FiAlertTriangle />
        </span>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={isWorking}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isWorking} autoFocus>
          {isWorking && <Spinner animation="border" size="sm" aria-hidden="true" />}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
