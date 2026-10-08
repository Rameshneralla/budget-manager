/** Status pill with icon + text (never colour alone). Appearance: constants STATUS_APPEARANCE. */
import { DEFAULT_STATUS_APPEARANCE, STATUS_APPEARANCE } from '../../constants';

export function getStatusAppearance(status) {
  return STATUS_APPEARANCE[status] ?? DEFAULT_STATUS_APPEARANCE;
}

export default function StatusBadge({ status, children }) {
  const { tone, icon: Icon } = getStatusAppearance(status);
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <Icon aria-hidden="true" />
      {status}
      {children}
    </span>
  );
}
