import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

// GitHub Pages build ("vite build --mode pages"): the app is served from
// https://<user>.github.io/<repo>/ and runs SQLite in the browser (src/local-backend).
const PAGES_MODE = 'pages';
const PAGES_BASE = '/budget-manager/';

const CLIENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SRC = path.resolve(CLIENT_DIR, '..', 'server', 'src');
const SHIMS_DIR = path.resolve(CLIENT_DIR, 'src', 'local-backend', 'shims');

/**
 * Comparable form of a file path. Windows paths are case-insensitive and the
 * drive letter may arrive as 'c:' or 'C:' depending on how the build was started,
 * so compare them in lower case there.
 */
function pathKey(filePath) {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

const SERVER_SRC_KEY = pathKey(SERVER_SRC);

/**
 * One id per shim file, using its real on-disk spelling. Shims are reached both
 * from server code (mapped below) and from the browser backend's own imports;
 * if those ids differed even in letter case, the bundle would hold two copies
 * of the module, e.g. two separate database connections.
 */
function canonicalId(filePath) {
  return normalizePath(fs.realpathSync.native(filePath));
}

const SHIM_FILE_KEYS = new Set(
  ['env.cjs', 'connection.cjs', 'nodeBuiltins.cjs'].map((name) =>
    pathKey(path.join(SHIMS_DIR, name))
  )
);

/** Server modules that need Node.js, mapped to their browser replacements. */
const SERVER_MODULE_SHIMS = {
  [pathKey(path.join(SERVER_SRC, 'config', 'env.js'))]: path.join(SHIMS_DIR, 'env.cjs'),
  [pathKey(path.join(SERVER_SRC, 'database', 'connection.js'))]: path.join(
    SHIMS_DIR,
    'connection.cjs'
  ),
};
const NODE_BUILTIN_SHIM = path.join(SHIMS_DIR, 'nodeBuiltins.cjs');
const SHIMMED_BUILTINS = new Set(['fs', 'path', 'node:fs', 'node:path']);

function cleanId(id) {
  return id.replace(/^\0/, '').replace(/\?.*$/, '');
}

/** Lets the shared server code (CommonJS, written for Node) run in the browser bundle. */
function serverCodeInBrowser() {
  return {
    name: 'budget-manager:server-code-in-browser',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !(source.startsWith('.') || SHIMMED_BUILTINS.has(source))) {
        return null;
      }
      const importerPath = path.normalize(cleanId(importer));
      const isServerCode = pathKey(importerPath).startsWith(SERVER_SRC_KEY);

      if (SHIMMED_BUILTINS.has(source)) {
        return isServerCode ? canonicalId(NODE_BUILTIN_SHIM) : null;
      }
      const resolved = path.resolve(path.dirname(importerPath), source);
      // The browser backend importing a shim directly (e.g. ./shims/connection.cjs).
      if (SHIM_FILE_KEYS.has(pathKey(resolved))) {
        return canonicalId(resolved);
      }
      if (!isServerCode) {
        return null;
      }
      const withExtension = resolved.endsWith('.js') ? resolved : `${resolved}.js`;
      const shim = SERVER_MODULE_SHIMS[pathKey(withExtension)];
      return shim ? canonicalId(shim) : null;
    },
    // Safety net: a build that would break in the browser must not be deployed.
    generateBundle(_options, bundle) {
      const moduleIds = Object.values(bundle).flatMap((chunk) => Object.keys(chunk.modules ?? {}));
      if (moduleIds.some((id) => id.includes('better-sqlite3'))) {
        this.error('The Node-only SQLite driver (better-sqlite3) ended up in the browser bundle.');
      }
      // Real file modules only: '\0...?commonjs-...' entries are the bundler's own helpers.
      const shimCopies = moduleIds.filter(
        (id) => !id.startsWith('\0') && !id.includes('?') && SHIM_FILE_KEYS.has(pathKey(id))
      );
      if (new Set(shimCopies.map(pathKey)).size !== shimCopies.length) {
        this.error(`A browser shim was bundled twice: ${shimCopies.join(', ')}`);
      }
    },
  };
}

/** GitHub Pages: 404.html makes deep links (/budget-manager/income) load the app. */
function githubPagesFiles() {
  return {
    name: 'budget-manager:github-pages-files',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(CLIENT_DIR, 'dist-pages');
      if (!fs.existsSync(path.join(outDir, 'index.html'))) {
        return; // the build failed; let its own error show
      }
      fs.copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ mode }) => {
  const isPages = mode === PAGES_MODE;

  return {
    base: isPages ? PAGES_BASE : '/',
    plugins: [react(), ...(isPages ? [serverCodeInBrowser(), githubPagesFiles()] : [])],
    resolve: {
      // Normal builds talk to the Express server: keep the in-browser backend out.
      alias: isPages
        ? []
        : [
            {
              find: /^\.\.\/local-backend\/localApi$/,
              replacement: path.join(CLIENT_DIR, 'src', 'local-backend', 'localApi.stub.js'),
            },
          ],
    },
    server: {
      port: 5173,
      // In development, /api calls are forwarded to the Express server,
      // so the browser sees one origin and no CORS setup is needed.
      proxy: {
        '/api': API_TARGET,
      },
    },
    build: {
      outDir: isPages ? 'dist-pages' : 'dist',
      sourcemap: !isPages,
      chunkSizeWarningLimit: 900,
      // The Pages build bundles server/src (CommonJS) into the browser app.
      commonjsOptions: isPages
        ? {
            include: [/node_modules/, /server[\\/]src[\\/]/, /local-backend[\\/]shims[\\/]/],
            transformMixedEsModules: true,
          }
        : undefined,
    },
  };
});
