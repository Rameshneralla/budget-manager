/**
 * Renders the RBM logo (client/icon-source/*.svg) into the PNG app icons in
 * client/public/icons, using headless Google Chrome (or Edge).
 *
 *   node scripts/generate-icons.mjs
 *   CHROME_PATH="/path/to/chrome" node scripts/generate-icons.mjs   (other installs / OS)
 *
 * Only needed after changing the logo; the generated PNGs are committed.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'client', 'icon-source');
const OUTPUT_DIR = path.join(ROOT, 'client', 'public', 'icons');
const DEBUG_PORT = 9339;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

/** [source svg, output file, size in px] */
const ICONS = [
  ['rbm-logo.svg', 'icon-192.png', 192],
  ['rbm-logo.svg', 'icon-512.png', 512],
  ['rbm-logo.svg', 'favicon-32.png', 32],
  ['rbm-logo-maskable.svg', 'maskable-512.png', 512],
  ['rbm-logo-maskable.svg', 'apple-touch-icon.png', 180],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectToChrome() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
      const page = targets.find((target) => target.type === 'page');
      if (page) {
        const socket = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve) => (socket.onopen = resolve));
        return socket;
      }
    } catch {
      // Chrome is still starting.
    }
    await sleep(250);
  }
  throw new Error('Could not connect to headless Chrome.');
}

async function main() {
  const chromePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!chromePath) {
    throw new Error('Chrome/Edge not found. Set CHROME_PATH to your browser executable.');
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const profileDir = mkdtempSync(path.join(tmpdir(), 'rbm-icons-'));
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const socket = await connectToChrome();
    let messageId = 0;
    const pending = new Map();
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      pending.get(message.id)?.(message.result);
      pending.delete(message.id);
    };
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        messageId += 1;
        pending.set(messageId, resolve);
        socket.send(JSON.stringify({ id: messageId, method, params }));
      });

    await send('Page.enable');
    // Transparent background so the round icon has no square corners.
    await send('Emulation.setDefaultBackgroundColorOverride', {
      color: { r: 0, g: 0, b: 0, a: 0 },
    });

    for (const [sourceFile, outputFile, size] of ICONS) {
      const svg = readFileSync(path.join(SOURCE_DIR, sourceFile), 'utf8');
      const html = `<html><body style="margin:0;background:transparent">
        <img width="${size}" height="${size}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">
        </body></html>`;
      await send('Emulation.setDeviceMetricsOverride', {
        width: size,
        height: size,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send('Page.navigate', {
        url: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
      });
      await sleep(500);
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
      });
      writeFileSync(path.join(OUTPUT_DIR, outputFile), Buffer.from(data, 'base64'));
      console.log(`  ${outputFile} (${size}x${size})`);
    }
    socket.close();
  } finally {
    chrome.kill();
    await sleep(300);
    rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
