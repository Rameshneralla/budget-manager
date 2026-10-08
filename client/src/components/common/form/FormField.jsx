/**
 * Renders one form control from a field definition:
 *   { name, label, type, required, options, placeholder, helpText, maxLength }
 * type: 'text' | 'textarea' | 'amount' | 'date' | 'select'
 * options (select): [{ value, label }]
 */
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

const TEXTAREA_ROWS = 3;

function FieldControl({ field, value, onChange, isInvalid, describedBy }) {
  const common = {
    id: `field-${field.name}`,
    name: field.name,
    value,
    isInvalid,
    required: field.required,
    'aria-describedby': describedBy,
    onChange: (event) => onChange(field.name, event.target.value),
  };

  switch (field.type) {
    case 'select':
      return (
        <Form.Select {...common}>
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      );
    case 'textarea':
      return (
        <Form.Control
          {...common}
          as="textarea"
          rows={TEXTAREA_ROWS}
          placeholder={field.placeholder}
        />
      );
    case 'amount':
      return (
        <InputGroup hasValidation>
          <InputGroup.Text aria-hidden="true">₹</InputGroup.Text>
          <Form.Control
            {...common}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder={field.placeholder || '0'}
          />
        </InputGroup>
      );
    case 'date':
      return <Form.Control {...common} type="date" />;
    default:
      return (
        <Form.Control {...common} type="text" placeholder={field.placeholder} autoComplete="off" />
      );
  }
}

export default function FormField({ field, value, error, onChange }) {
  const helpId = field.helpText ? `field-${field.name}-help` : undefined;
  const errorId = error ? `field-${field.name}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <Form.Group controlId={`field-${field.name}`}>
      <Form.Label>
        {field.label}
        {field.required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </Form.Label>
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        isInvalid={Boolean(error)}
        describedBy={describedBy}
      />
      {error && (
        <Form.Control.Feedback type="invalid" id={errorId} className="d-block">
          {error}
        </Form.Control.Feedback>
      )}
      {field.helpText && (
        <Form.Text id={helpId} className="d-block">
          {field.helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
}
