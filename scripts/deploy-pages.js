/**
 * Publishes the GitHub Pages build (client/dist-pages) to the `gh-pages` branch.
 *
 *   npm run deploy:pages      (builds first, then runs this script)
 *
 * The branch only ever contains the built static files - no source code and no
 * budget data (the live app stores data in each visitor's own browser).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'client', 'dist-pages');
const BRANCH = 'gh-pages';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] })
    .toString()
    .trim();
}

function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    throw new Error('No build found. Run "npm run build:pages" first.');
  }

  const remoteUrl = git(['remote', 'get-url', 'origin'], PROJECT_ROOT);
  const sourceCommit = git(['rev-parse', '--short', 'HEAD'], PROJECT_ROOT);
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-pages-'));

  try {
    fs.cpSync(BUILD_DIR, workDir, { recursive: true });
    git(['init', '-q', '-b', BRANCH], workDir);
    git(['add', '-A'], workDir);
    git(['commit', '-q', '-m', `Deploy GitHub Pages from ${sourceCommit}`], workDir);
    console.log(`Pushing build of ${sourceCommit} to ${BRANCH}...`);
    git(['push', '--force', remoteUrl, `${BRANCH}:${BRANCH}`], workDir);
    console.log('Done. GitHub Pages updates within a minute or two.');
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main();
