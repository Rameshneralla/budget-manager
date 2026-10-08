/**
 * Keeps this device's database in step with the copy in your private GitHub
 * repository, so the phone, tablet and laptop all show the same budget.
 *
 *   Opening the app / returning to it   download the latest copy if another device changed it
 *   Every change (add, edit, status...) download first if needed, apply, then upload
 *   Two devices saving at the same time  the slower one downloads the new copy and re-applies
 *   No internet                          the change stays on this device and uploads later;
 *                                        if the other copy also changed meanwhile, you choose
 *                                        which one to keep (Settings > Sync)
 *
 * The whole SQLite file is synced, so record ids, history and links stay identical everywhere.
 * Settings (repository + token) are stored on this device only.
 */
import {
  exportDatabaseBytes,
  getBrowserDatabase,
  replaceBrowserDatabase,
} from '../browserDatabase';
import { checkRepository, downloadFile, SyncError, uploadFile } from './githubStore';
import dataService from '../../../../server/src/services/dataService';
import { SYNC_EVENTS } from '../../constants/syncEvents';

const SETTINGS_KEY = 'budget-manager.sync-settings';
const STATE_KEY = 'budget-manager.sync-state';
const DEFAULT_FILE_PATH = 'budget.sqlite';
const MAX_WRITE_ATTEMPTS = 3;
const STARTUP_SYNC_TIMEOUT_MS = 6000;
const FOCUS_SYNC_MIN_INTERVAL_MS = 15 * 1000;
const BACKGROUND_SYNC_INTERVAL_MS = 2 * 60 * 1000;

const { DATA_REPLACED: DATA_REPLACED_EVENT, STATUS_CHANGED: SYNC_STATUS_EVENT } = SYNC_EVENTS;

/* ------------------------------ Stored settings ----------------------------- */

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage unavailable: sync works for this session only.
  }
}

let settings = readJson(SETTINGS_KEY); // { owner, repo, path, token }
// sha = version of the GitHub copy this device last matched; pending = local changes not uploaded yet
let syncState = readJson(STATE_KEY) || { sha: null, pending: false, lastSyncedAt: null };
let status = { state: settings ? 'idle' : 'off', message: '' };
let startupSync = null;
let lastFocusSyncAt = 0;
let queue = Promise.resolve();

function saveState(changes) {
  syncState = { ...syncState, ...changes };
  writeJson(STATE_KEY, syncState);
}

function setStatus(state, message = '') {
  status = { state, message };
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: getSyncStatus() }));
}

/** One sync operation at a time, in order. */
function serialize(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function deviceLabel() {
  return /android|iphone|ipad|mobile/i.test(navigator.userAgent) ? 'phone/tablet' : 'computer';
}

export function getSyncStatus() {
  return {
    configured: Boolean(settings),
    repository: settings ? `${settings.owner}/${settings.repo}` : null,
    state: status.state, // off | idle | syncing | synced | offline | conflict | error
    message: status.message,
    pendingChanges: Boolean(syncState.pending),
    lastSyncedAt: syncState.lastSyncedAt,
  };
}

/* --------------------------------- Transfers -------------------------------- */

async function applyRemoteCopy(remote) {
  await replaceBrowserDatabase(remote.bytes);
  saveState({ sha: remote.sha, pending: false, lastSyncedAt: new Date().toISOString() });
  window.dispatchEvent(new CustomEvent(DATA_REPLACED_EVENT));
}

async function upload() {
  const bytes = await exportDatabaseBytes();
  const sha = await uploadFile(
    settings,
    bytes,
    syncState.sha,
    `Budget data update from ${deviceLabel()}`
  );
  saveState({ sha, pending: false, lastSyncedAt: new Date().toISOString() });
}

/**
 * Brings this device up to date with GitHub.
 * @returns {Promise<'unchanged'|'downloaded'|'uploaded'|'conflict'>}
 */
async function pullLatest() {
  const remote = await downloadFile(settings);
  if (!remote) {
    await upload(); // first device: create the synced copy
    return 'uploaded';
  }
  if (remote.sha === syncState.sha) {
    if (syncState.pending) {
      await upload(); // offline changes can go up: nothing changed elsewhere
      return 'uploaded';
    }
    return 'unchanged';
  }
  if (syncState.pending) {
    return 'conflict'; // both sides changed: the user decides (resolveConflict)
  }
  await applyRemoteCopy(remote);
  return 'downloaded';
}

function reportFailure(error) {
  if (error instanceof SyncError && error.kind === 'network') {
    setStatus('offline', 'Offline - changes are saved on this device and will sync later.');
  } else {
    setStatus('error', error.message || 'Sync failed.');
  }
}

function reportPullResult(result) {
  if (result === 'conflict') {
    setStatus(
      'conflict',
      'Both this device and another device changed the data. Choose which copy to keep in Settings.'
    );
  } else {
    setStatus('synced');
  }
}

/* ------------------------------ Public interface ---------------------------- */

/** Downloads changes from other devices (startup, focus, timer, "Sync now"). */
export function syncNow() {
  if (!settings) {
    return Promise.resolve(getSyncStatus());
  }
  return serialize(async () => {
    setStatus('syncing');
    try {
      reportPullResult(await pullLatest());
    } catch (error) {
      reportFailure(error);
    }
    return getSyncStatus();
  });
}

/**
 * Runs a change (`work`, synchronous, on the local database) as a synced write:
 * get the latest copy, apply the change, upload. If another device uploaded in
 * between, download its copy and apply the change again on top of it.
 */
export function runSyncedWrite(work) {
  if (!settings) {
    return Promise.resolve(work());
  }
  return serialize(async () => {
    setStatus('syncing');
    try {
      return await writeWithSync(work);
    } catch (error) {
      // The change itself failed (e.g. validation) - nothing was changed or uploaded.
      if (status.state === 'syncing') {
        setStatus('synced');
      }
      throw error;
    }
  });
}

async function writeWithSync(work) {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    let pullResult;
    try {
      pullResult = await pullLatest();
    } catch (error) {
      // Offline (or GitHub unavailable): change this device now, upload later.
      const result = work();
      saveState({ pending: true });
      reportFailure(error);
      return result;
    }
    if (pullResult === 'conflict') {
      const result = work();
      saveState({ pending: true });
      reportPullResult('conflict');
      return result;
    }

    const result = work();
    try {
      await upload();
      setStatus('synced');
      return result;
    } catch (error) {
      if (error instanceof SyncError && error.kind === 'conflict' && attempt < MAX_WRITE_ATTEMPTS) {
        // Another device saved first: undo by taking its copy, then apply this change again.
        await applyRemoteCopy(await downloadFile(settings));
        continue;
      }
      saveState({ pending: true });
      reportFailure(error);
      return result;
    }
  }
  return undefined;
}

/**
 * Connects this device. `choice` matters only when both this device and GitHub
 * already have data: 'cloud' = use the synced copy, 'device' = upload this device's copy.
 * @returns {Promise<{ needsChoice: boolean, status: object }>}
 */
export async function connect({ owner, repo, token, path = DEFAULT_FILE_PATH }, choice = null) {
  const candidate = { owner: owner.trim(), repo: repo.trim(), token: token.trim(), path };
  await checkRepository(candidate);
  await getBrowserDatabase();
  const remote = await downloadFile(candidate);
  const deviceHasData = !dataService.isDatabaseEmpty();

  if (remote && deviceHasData && !choice) {
    return { needsChoice: true, status: getSyncStatus() };
  }

  return serialize(async () => {
    settings = candidate;
    writeJson(SETTINGS_KEY, settings);
    saveState({ sha: remote?.sha ?? null, pending: false });
    try {
      if (remote && (choice === 'cloud' || !deviceHasData)) {
        await applyRemoteCopy(remote);
      } else {
        await upload(); // no synced copy yet, or this device's copy was chosen
      }
      setStatus('synced');
      startAutoSync();
    } catch (error) {
      reportFailure(error);
      throw error;
    }
    return { needsChoice: false, status: getSyncStatus() };
  });
}

/** After a conflict: keep this device's copy ('device') or the synced copy ('cloud'). */
export function resolveConflict(keep) {
  return serialize(async () => {
    setStatus('syncing');
    try {
      const remote = await downloadFile(settings);
      if (keep === 'cloud' && remote) {
        await applyRemoteCopy(remote);
      } else {
        saveState({ sha: remote?.sha ?? null });
        await upload();
      }
      setStatus('synced');
    } catch (error) {
      reportFailure(error);
    }
    return getSyncStatus();
  });
}

/** Stops syncing on this device (its data stays; the GitHub copy is untouched). */
export function disconnect() {
  settings = null;
  writeJson(SETTINGS_KEY, null);
  saveState({ sha: null, pending: false, lastSyncedAt: null });
  setStatus('off');
  return getSyncStatus();
}

/* -------------------------------- Auto sync --------------------------------- */

let autoSyncStarted = false;

function syncWhenVisible() {
  if (document.visibilityState !== 'visible' || !settings) {
    return;
  }
  const now = Date.now();
  if (now - lastFocusSyncAt < FOCUS_SYNC_MIN_INTERVAL_MS) {
    return;
  }
  lastFocusSyncAt = now;
  syncNow();
}

function startAutoSync() {
  if (autoSyncStarted) {
    return;
  }
  autoSyncStarted = true;
  window.addEventListener('focus', syncWhenVisible);
  document.addEventListener('visibilitychange', syncWhenVisible);
  window.addEventListener('online', syncWhenVisible);
  window.setInterval(syncWhenVisible, BACKGROUND_SYNC_INTERVAL_MS);
}

/**
 * Called before the first request: if sync is set up, try to download the
 * latest copy first (waiting at most a few seconds) so the first screen is current.
 */
export function ensureStartupSync() {
  if (!settings) {
    return Promise.resolve();
  }
  if (!startupSync) {
    startAutoSync();
    lastFocusSyncAt = Date.now();
    const timeout = new Promise((resolve) => setTimeout(resolve, STARTUP_SYNC_TIMEOUT_MS));
    startupSync = Promise.race([syncNow(), timeout]);
  }
  return startupSync;
}
