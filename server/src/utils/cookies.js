/** Minimal cookie helpers (avoids an extra dependency for one session cookie). */

/** 'a=1; b=2' -> { a: '1', b: '2' } */
function parseCookies(header = '') {
  const cookies = {};
  header.split(';').forEach((part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }
    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  });
  return cookies;
}

module.exports = { parseCookies };
