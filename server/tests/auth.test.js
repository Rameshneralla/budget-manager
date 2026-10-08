/**
 * Login tests. Run with: npm test
 * Runs the app with APP_PASSWORD set and an in-memory database.
 */
process.env.DATABASE_PATH = ':memory:';
// Always the committed FICTIONAL sample data, never your private seed file.
process.env.SEED_FILE = require('path').join(
  __dirname,
  '..',
  'src',
  'database',
  'seed-data',
  'sample-data.json'
);
process.env.NODE_ENV = 'test';
process.env.APP_PASSWORD = 'correct horse battery staple';
process.env.SESSION_SECRET = 'test-secret';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const { runMigrations } = require('../src/database/migrator');
const { closeDb } = require('../src/database/connection');
const { seedInitialData } = require('../src/services/seedService');

let server;
let baseUrl;

async function api(method, path, { body, cookie } = {}) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (cookie) {
    headers.Cookie = cookie;
  }
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
    setCookie: response.headers.get('set-cookie'),
  };
}

before(async () => {
  runMigrations();
  seedInitialData();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  closeDb();
});

describe('login', () => {
  it('reports that a login is required', async () => {
    const { body } = await api('GET', '/auth/session');
    assert.deepEqual(body.data, { authRequired: true, authenticated: false });
  });

  it('blocks budget data without a session but keeps health public', async () => {
    assert.equal((await api('GET', '/dashboard?month=2026-10')).status, 401);
    assert.equal((await api('GET', '/data/export')).status, 401);
    assert.equal((await api('GET', '/health')).status, 200);
  });

  it('rejects a wrong password and a forged cookie', async () => {
    const wrong = await api('POST', '/auth/login', { body: { password: 'nope' } });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.setCookie, null);

    const forged = await api('GET', '/months', {
      cookie: `budget_session=${Date.now() + 1e9}.fake`,
    });
    assert.equal(forged.status, 401);
  });

  it('signs in with the right password, then signs out', async () => {
    const login = await api('POST', '/auth/login', {
      body: { password: 'correct horse battery staple' },
    });
    assert.equal(login.status, 200);
    assert.match(login.setCookie, /budget_session=.+HttpOnly/i);
    assert.match(login.setCookie, /SameSite=Strict/i);

    const cookie = login.setCookie.split(';')[0];
    const months = await api('GET', '/months', { cookie });
    assert.equal(months.status, 200);
    assert.deepEqual(months.body.data, ['2026-10']);
    assert.equal((await api('GET', '/auth/session', { cookie })).body.data.authenticated, true);

    const logout = await api('POST', '/auth/logout', { cookie });
    assert.match(logout.setCookie, /budget_session=;/);
  });

  it('locks out an address after repeated wrong passwords', async () => {
    let last;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      last = await api('POST', '/auth/login', { body: { password: `wrong-${attempt}` } });
    }
    assert.equal(last.status, 429);
    const evenCorrect = await api('POST', '/auth/login', {
      body: { password: 'correct horse battery staple' },
    });
    assert.equal(evenCorrect.status, 429);
  });
});
