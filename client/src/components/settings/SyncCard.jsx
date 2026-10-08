/**
 * Settings > Sync across devices (GitHub Pages build only).
 * Connects this device to a PRIVATE GitHub repository that holds the synced
 * database, shows the sync status and handles conflicts. Logic: local-backend/sync.
 */
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { toast } from 'react-toastify';
import { FiCloud, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { syncService } from '../../services/syncService';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { useBudget } from '../../context/BudgetContext';
import { formatDateTime } from '../../utils/formatters';

const DEFAULT_REPOSITORY = 'Rameshneralla/budget-manager-data';
const NEW_REPOSITORY_URL =
  'https://github.com/new?name=budget-manager-data&visibility=private&description=Budget%20Manager%20synced%20data';
const NEW_TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

const STATE_LABELS = {
  idle: 'Connected',
  syncing: 'Syncing...',
  synced: 'Up to date',
  offline: 'Offline - will sync when back online',
  conflict: 'Needs your choice',
  error: 'Sync problem',
};

function parseRepository(value) {
  const [owner, repo] = value
    .trim()
    .replace(/^https:\/\/github.com\//, '')
    .split('/');
  return owner && repo ? { owner, repo: repo.replace(/\.git$/, '') } : null;
}

function SetupSteps() {
  return (
    <ol className="sync-steps">
      <li>
        <a href={NEW_REPOSITORY_URL} target="_blank" rel="noreferrer">
          Create a private repository <FiExternalLink aria-hidden="true" />
        </a>{' '}
        named <code>budget-manager-data</code> (keep <strong>Private</strong> selected).
      </li>
      <li>
        <a href={NEW_TOKEN_URL} target="_blank" rel="noreferrer">
          Create an access token <FiExternalLink aria-hidden="true" />
        </a>
        : Repository access → <em>Only select repositories</em> → <code>budget-manager-data</code>;
        Permissions → <em>Add permissions</em> → <em>Contents</em> → <em>Read and write</em>. Copy
        the token.
      </li>
      <li>Enter it below on each device (laptop, phone, tablet) once.</li>
    </ol>
  );
}

function ConnectForm({ onConnected }) {
  const [repository, setRepository] = useState(DEFAULT_REPOSITORY);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);

  async function connect(choice = null) {
    const parsed = parseRepository(repository);
    if (!parsed || !token.trim()) {
      setError('Enter the repository as owner/name and paste the access token.');
      return;
    }
    setIsConnecting(true);
    setError('');
    try {
      const result = await syncService.connect({ ...parsed, token, choice });
      if (result.needsChoice) {
        setPendingChoice(parsed);
        return;
      }
      setPendingChoice(null);
      toast.success('This device is now syncing with GitHub');
      onConnected(result.status);
    } catch (connectError) {
      setError(connectError.message);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <>
      <SetupSteps />
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          connect();
        }}
        className="d-flex flex-column gap-2"
      >
        <Form.Group controlId="sync-repository">
          <Form.Label>Private repository</Form.Label>
          <Form.Control
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            placeholder="owner/name"
            autoComplete="off"
          />
        </Form.Group>
        <Form.Group controlId="sync-token">
          <Form.Label>Access token</Form.Label>
          <Form.Control
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="github_pat_..."
            autoComplete="off"
          />
          <Form.Text>Stored only on this device and sent only to GitHub.</Form.Text>
        </Form.Group>
        {error && (
          <p className="text-danger small mb-0" role="alert">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" variant="primary" disabled={isConnecting}>
            {isConnecting ? (
              <Spinner animation="border" size="sm" aria-hidden="true" />
            ) : (
              <FiCloud aria-hidden="true" />
            )}
            Connect this device
          </Button>
        </div>
      </Form>

      <Modal show={Boolean(pendingChoice)} onHide={() => setPendingChoice(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Which data should be used?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Both this device and GitHub already have budget data. Choose the copy to keep - the other
          one will be replaced.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => connect('device')}
            disabled={isConnecting}
          >
            Keep this device&apos;s data
          </Button>
          <Button variant="primary" onClick={() => connect('cloud')} disabled={isConnecting}>
            Use the synced data
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function ConnectedView({ status, onStatus }) {
  const [isBusy, setIsBusy] = useState(false);

  async function run(action, successMessage) {
    setIsBusy(true);
    try {
      onStatus(await action());
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      <dl className="sync-status">
        <div>
          <dt>Repository</dt>
          <dd>{status.repository}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`sync-dot sync-dot--${status.state}`} aria-hidden="true" />
            {STATE_LABELS[status.state] ?? status.state}
            {status.pendingChanges && status.state !== 'conflict' && ' (changes waiting to upload)'}
          </dd>
        </div>
        <div>
          <dt>Last synced</dt>
          <dd>{status.lastSyncedAt ? formatDateTime(status.lastSyncedAt) : '—'}</dd>
        </div>
      </dl>
      {status.message && status.state !== 'synced' && (
        <p className="small mb-0 text-secondary" role="status">
          {status.message}
        </p>
      )}

      {status.state === 'conflict' ? (
        <div className="d-flex flex-wrap gap-2">
          <Button
            variant="outline-secondary"
            disabled={isBusy}
            onClick={() =>
              run(
                () => syncService.resolveConflict('device'),
                'This device’s data was kept and synced'
              )
            }
          >
            Keep this device&apos;s data
          </Button>
          <Button
            variant="primary"
            disabled={isBusy}
            onClick={() => run(() => syncService.resolveConflict('cloud'), 'Synced data loaded')}
          >
            Use the synced data
          </Button>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" disabled={isBusy} onClick={() => run(syncService.syncNow)}>
            <FiRefreshCw aria-hidden="true" /> Sync now
          </Button>
          <Button
            variant="outline-secondary"
            disabled={isBusy}
            onClick={() => run(syncService.disconnect, 'Sync turned off on this device')}
          >
            Disconnect this device
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SyncCard() {
  const { status, setStatus } = useSyncStatus();
  const { notifyDataChanged } = useBudget();

  if (!status) {
    return null;
  }

  return (
    <section className="panel mb-4" aria-labelledby="sync-title">
      <div className="panel__body d-flex flex-column gap-3">
        <div className="d-flex gap-3 align-items-start">
          <span className="stat-card__icon tone-info" aria-hidden="true">
            <FiCloud />
          </span>
          <div>
            <h2 id="sync-title" className="panel__title">
              Sync across devices
            </h2>
            <p className="panel__subtitle">
              Keep your laptop, phone and tablet showing the same budget. Data is stored in your own
              private GitHub repository - free and visible only to you.
            </p>
          </div>
        </div>
        {status.configured ? (
          <ConnectedView status={status} onStatus={setStatus} />
        ) : (
          <ConnectForm
            onConnected={(connectedStatus) => {
              setStatus(connectedStatus);
              notifyDataChanged();
            }}
          />
        )}
      </div>
    </section>
  );
}
