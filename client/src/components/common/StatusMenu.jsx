/**
 * A status badge that opens a menu to change the status in one click
 * (e.g. House Rent: Pending -> Received) without opening the edit form.
 */
import Dropdown from 'react-bootstrap/Dropdown';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import StatusBadge, { getStatusAppearance } from './StatusBadge';

export default function StatusMenu({ status, statuses, onChange, recordLabel, disabled = false }) {
  return (
    <Dropdown className="status-menu">
      <Dropdown.Toggle
        as="button"
        type="button"
        disabled={disabled}
        aria-label={`Status of ${recordLabel}: ${status}. Change status`}
      >
        <StatusBadge status={status}>
          <FiChevronDown aria-hidden="true" />
        </StatusBadge>
      </Dropdown.Toggle>
      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} renderOnMount>
        <Dropdown.Header>Change status</Dropdown.Header>
        {statuses.map((option) => {
          const { icon: Icon } = getStatusAppearance(option);
          const isCurrent = option === status;
          return (
            <Dropdown.Item
              key={option}
              as="button"
              type="button"
              active={false}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => !isCurrent && onChange(option)}
            >
              <Icon aria-hidden="true" />
              <span className="flex-grow-1">{option}</span>
              {isCurrent && <FiCheck aria-label="current status" />}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
