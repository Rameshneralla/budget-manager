/**
 * Stand-in for Node's `fs` and `path` when shared server code is bundled for the
 * browser. Only server-only features (file backups, seed files) touch them, and
 * the browser backend never calls those, so they simply report that clearly.
 */
function unavailable(name) {
  return () => {
    throw new Error(`${name} is not available in the browser version.`);
  };
}

module.exports = {
  // fs
  existsSync: () => false,
  readFileSync: unavailable('Reading files'),
  mkdirSync: unavailable('Creating folders'),
  // path
  join: (...parts) => parts.join('/'),
  basename: (filePath) => String(filePath).split(/[\\/]/).pop(),
};
