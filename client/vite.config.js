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

/** Server modules that need Node.js, mapped to their browser replacements. */
const SERVER_MODULE_SHIMS = {
  [path.join(SERVER_SRC, 'config', 'env.js')]: path.join(SHIMS_DIR, 'env.cjs'),
  [path.join(SERVER_SRC, 'database', 'connection.js')]: path.join(SHIMS_DIR, 'connection.cjs'),
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
      if (!importer) {
        return null;
      }
      const importerPath = path.normalize(cleanId(importer));
      if (!importerPath.startsWith(SERVER_SRC)) {
        return null;
      }
      if (SHIMMED_BUILTINS.has(source)) {
        return normalizePath(NODE_BUILTIN_SHIM);
      }
      if (source.startsWith('.')) {
        const resolved = path.resolve(path.dirname(importerPath), source);
        const withExtension = resolved.endsWith('.js') ? resolved : `${resolved}.js`;
        const shim = SERVER_MODULE_SHIMS[withExtension];
        // Forward slashes: the bundler must see the same id the app's own imports use,
        // otherwise it would create a second copy of the module.
        return shim ? normalizePath(shim) : null;
      }
      return null;
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
