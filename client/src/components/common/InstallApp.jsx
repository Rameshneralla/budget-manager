/**
 * "Install RBM" - lets the budget manager be installed like an app on phones,
 * tablets and laptops straight from the website (no Play Store / App Store).
 *
 * Renders an Install button for the header plus a card at the bottom of the
 * screen. The card appears on its own until dismissed ("Not now" hides it for
 * DISMISS_DAYS); the header button stays available. Nothing shows once installed
 * or in browsers that cannot install apps.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { FiDownload, FiPlusSquare, FiShare, FiX } from 'react-icons/fi';
import RbmLogo from './RbmLogo';
import { useInstallApp } from '../../hooks/useInstallApp';
import { readPreference, writePreference } from '../../utils/browserStorage';

const DISMISS_STORAGE_KEY = 'budget-manager.install-dismissed-until';
const DISMISS_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function wasDismissedRecently() {
  return Number(readPreference(DISMISS_STORAGE_KEY) || 0) > Date.now();
}

function InstallCard({ installMode, onInstall, onDismiss }) {
  const isIos = installMode === 'ios';

  return (
    <aside className="install-card" role="dialog" aria-labelledby="install-card-title">
      <RbmLogo size={44} className="install-card__logo" />
      <div className="install-card__body">
        <h2 id="install-card-title" className="install-card__title">
          Install RBM app
        </h2>
        {isIos ? (
          <p className="install-card__text">
            Tap <FiShare aria-label="Share" className="install-card__inline-icon" />{' '}
            <strong>Share</strong>, then{' '}
            <FiPlusSquare aria-hidden="true" className="install-card__inline-icon" />{' '}
            <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="install-card__text">
            Add your budget to the home screen or desktop. Opens in its own window and works
            offline.
          </p>
        )}
        <div className="install-card__actions">
          {isIos ? (
            <Button size="sm" variant="primary" onClick={onDismiss}>
              Got it
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline-secondary" onClick={onDismiss}>
                Not now
              </Button>
              <Button size="sm" variant="primary" onClick={onInstall}>
                <FiDownload aria-hidden="true" /> Install
              </Button>
            </>
          )}
        </div>
      </div>
      <button type="button" className="install-card__close" onClick={onDismiss} aria-label="Close">
        <FiX aria-hidden="true" />
      </button>
    </aside>
  );
}

export default function InstallApp() {
  const { installMode, install } = useInstallApp();
  const [isCardOpen, setIsCardOpen] = useState(() => !wasDismissedRecently());

  if (!installMode) {
    return null;
  }

  function dismiss() {
    writePreference(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_DAYS * MS_PER_DAY));
    setIsCardOpen(false);
  }

  async function handleInstall() {
    if (installMode === 'ios') {
      setIsCardOpen(true); // show the Share > Add to Home Screen steps
      return;
    }
    setIsCardOpen(false);
    if (await install()) {
      toast.success('RBM installed. Open it from your home screen or apps.');
    }
  }

  return (
    <>
      <button
        type="button"
        className="icon-button icon-button--bordered"
        onClick={handleInstall}
        aria-label="Install app"
        title="Install app"
      >
        <FiDownload aria-hidden="true" />
      </button>
      {/* Portal: the header tools sit inside the collapsed mobile menu, which would hide the card. */}
      {isCardOpen &&
        createPortal(
          <InstallCard installMode={installMode} onInstall={handleInstall} onDismiss={dismiss} />,
          document.body
        )}
    </>
  );
}
