import Form from 'react-bootstrap/Form';
import { FiSearch } from 'react-icons/fi';

export default function SearchInput({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <Form.Label htmlFor={id}>{label}</Form.Label>
      <div className="search-input">
        <FiSearch className="search-input__icon" aria-hidden="true" />
        <Form.Control
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
