/**
 * Client-side form validation, driven by the same field definitions that
 * render the form (see components/<feature>/*FormConfig.js).
 *
 * The server validates everything again (server/src/validators) - this layer
 * exists only to give instant, friendly feedback before a request is sent.
 *
 * Field definition properties used here:
 *   required   boolean
 *   type       'text' | 'textarea' | 'amount' | 'date' | 'select' | 'month'
 *   maxLength  number (text fields)
 *   validate   optional (value, allValues) => error message | undefined
 */
import { VALIDATION_LIMITS } from '../constants/validation';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_DECIMAL_PLACES = 2;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function isValidIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateAmount(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return `${label} must be a number.`;
  }
  if (amount <= 0) {
    return `${label} must be greater than 0.`;
  }
  if (amount > VALIDATION_LIMITS.MAX_AMOUNT) {
    return `${label} is too large.`;
  }
  const [, decimals = ''] = String(value).split('.');
  if (decimals.length > MAX_DECIMAL_PLACES) {
    return `${label} can have at most ${MAX_DECIMAL_PLACES} decimal places.`;
  }
  return undefined;
}

function validateByType(field, value) {
  switch (field.type) {
    case 'amount':
      return validateAmount(value, field.label);
    case 'date':
      return isValidIsoDate(String(value)) ? undefined : `${field.label} must be a valid date.`;
    case 'month':
      return MONTH_KEY_PATTERN.test(String(value))
        ? undefined
        : `${field.label} must be a valid month.`;
    default: {
      const maxLength = field.maxLength ?? VALIDATION_LIMITS.MAX_TEXT_LENGTH;
      return String(value).trim().length > maxLength
        ? `${field.label} must be ${maxLength} characters or fewer.`
        : undefined;
    }
  }
}

function validateField(field, values) {
  const value = values[field.name];
  if (isBlank(value)) {
    return field.required ? `${field.label} is required.` : undefined;
  }
  return validateByType(field, value) ?? field.validate?.(value, values);
}

/** Returns { fieldName: message } for every invalid field (empty object when valid). */
export function validateFields(fields, values) {
  const errors = {};
  fields.forEach((field) => {
    const message = validateField(field, values);
    if (message) {
      errors[field.name] = message;
    }
  });
  return errors;
}

/** '' -> null, '  text ' -> 'text'. Used when turning form values into API payloads. */
export function toNullableText(value) {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
}

/** '' -> null, '3' -> 3 */
export function toNullableId(value) {
  return isBlank(value) ? null : Number(value);
}

/** null -> '' so controlled inputs never receive null. */
export function toInputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}
