/**
 * Add / edit modal used by Income and Expenses.
 *
 * The form is described by `fields` (see components/<feature>/*FormConfig.js);
 * this component handles state, client validation, server field errors,
 * the saving spinner, Save and Cancel. Mount it with a new `key` per opening
 * so it starts from fresh `initialValues`.
 */
import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import FormField from './FormField';
import { validateFields } from '../../../utils/validation';

const FULL_WIDTH_TYPES = ['textarea'];

/** One column on phones, two on tablets, three on laptops and wider. */
function columnSizes(field) {
  return FULL_WIDTH_TYPES.includes(field.type) ? { md: 12 } : { md: 6, lg: 4 };
}

function focusField(name) {
  document.getElementById(`field-${name}`)?.focus();
}

const DYNAMIC_PROPERTIES = ['label', 'required', 'helpText', 'placeholder'];

/**
 * Fields can depend on the other values (e.g. income type):
 *   visible(values) -> false hides the field (not shown, not validated)
 *   label / required / helpText / placeholder may be (values) => value
 */
function resolveFields(fields, values) {
  return fields
    .filter((field) => !field.visible || field.visible(values))
    .map((field) => {
      const resolved = { ...field };
      DYNAMIC_PROPERTIES.forEach((property) => {
        if (typeof field[property] === 'function') {
          resolved[property] = field[property](values);
        }
      });
      return resolved;
    });
}

export default function RecordFormModal({
  show,
  title,
  fields: fieldDefinitions,
  initialValues,
  onSubmit,
  onHide,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const fields = resolveFields(fieldDefinitions, values);

  function handleChange(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateFields(fields, values);
    const firstInvalidField = fields.find((field) => validationErrors[field.name]);
    if (firstInvalidField) {
      setErrors(validationErrors);
      focusField(firstInvalidField.name);
      return;
    }

    setIsSaving(true);
    try {
      // Hidden fields keep their values (e.g. an old purpose), so nothing is lost on edit.
      await onSubmit(values);
    } catch (error) {
      // Server-side validation errors are shown next to their fields.
      setErrors(error.fieldErrors || {});
      setIsSaving(false);
    }
  }

  return (
    <Modal
      show={show}
      onHide={isSaving ? undefined : onHide}
      size="xl"
      centered
      scrollable
      backdrop="static"
      aria-labelledby="record-form-title"
    >
      {/* record-form keeps the header and footer fixed while only the fields scroll. */}
      <Form noValidate onSubmit={handleSubmit} className="record-form">
        <Modal.Header closeButton={!isSaving}>
          <Modal.Title id="record-form-title">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="form-text mt-0 mb-2">
            Fields marked <span className="required-mark">*</span> are required.
          </p>
          <Row className="gx-3 gy-2">
            {fields.map((field) => (
              <Col key={field.name} xs={12} {...columnSizes(field)}>
                <FormField
                  field={field}
                  value={values[field.name] ?? ''}
                  error={errors[field.name]}
                  onChange={handleChange}
                />
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving && <Spinner animation="border" size="sm" aria-hidden="true" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
