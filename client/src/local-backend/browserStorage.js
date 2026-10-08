/**
 * Keeps the SQLite database file in the browser's IndexedDB, so data survives
 * page reloads and browser restarts. (Clearing the site's browser data deletes it -
 * use Settings > Export Data for backups.)
 */
const IDB_NAME = 'budget-manager';
const IDB_STORE = 'files';
const DATABASE_KEY = 'budget.sqlite';

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const idb = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = idb.transaction(IDB_STORE, mode);
      const request = action(transaction.objectStore(IDB_STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    idb.close();
  }
}

/** @returns {Promise<Uint8Array | null>} */
export async function loadDatabaseFile() {
  const stored = await withStore('readonly', (store) => store.get(DATABASE_KEY));
  return stored ? new Uint8Array(stored) : null;
}

export function saveDatabaseFile(bytes) {
  return withStore('readwrite', (store) => store.put(bytes, DATABASE_KEY));
}
