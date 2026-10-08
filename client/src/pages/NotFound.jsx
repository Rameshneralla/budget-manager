import { Link } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import { EmptyState } from '../components/common/StateBlocks';
import { ROUTES } from '../constants';

export default function NotFound() {
  return (
    <EmptyState
      icon={FiCompass}
      title="Page not found"
      message="The page you are looking for does not exist."
      action={
        <Link to={ROUTES.DASHBOARD} className="btn btn-primary">
          Go to Dashboard
        </Link>
      }
    />
  );
}
