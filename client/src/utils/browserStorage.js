/**
 * Safe wrappers around localStorage. Used ONLY for UI preferences (theme,
 * last selected month) - never for budget data, which lives in SQLite.
 * Storage can be unavailable (private mode, blocked cookies), so failures are ignored.
 */
export function readPreference(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preference simply isn't remembered.
  }
}
