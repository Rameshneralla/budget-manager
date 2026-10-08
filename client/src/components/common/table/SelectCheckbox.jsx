/** Checkbox that also supports the "some selected" (indeterminate) state. */
import { useEffect, useRef } from 'react';

export default function SelectCheckbox({ checked, indeterminate = false, onChange, label, id }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="checkbox"
      className="form-check-input"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
  );
}
