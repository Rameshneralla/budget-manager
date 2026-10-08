/**
 * API integration tests. Run with: npm test
 * Uses an in-memory SQLite database seeded with the FICTIONAL sample data
 * (src/database/seed-data/sample-data.json),
 * so your real database file is never touched.
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
process.env.APP_PASSWORD = ''; // open mode; login is covered by auth.test.js

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const { runMigrations } = require('../src/database/migrator');
const { closeDb } = require('../src/database/connection');
const { seedInitialData } = require('../src/services/seedService');

let server;
let baseUrl;

async function api(method, path, body) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, body: json };
}

async function getSummary(month = '2026-10') {
  const { body } = await api('GET', `/dashboard?month=${month}`);
  return body.data.summary;
}

async function findIncome(predicate) {
  const { body } = await api('GET', '/income?month=2026-10');
  return body.data.find(predicate);
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

describe('seed data and dashboard', () => {
  it('lists only October 2026 as an available month', async () => {
    const { status, body } = await api('GET', '/months');
    assert.equal(status, 200);
    assert.deepEqual(body.data, ['2026-10']);
  });

  it('calculates the October 2026 totals from the records', async () => {
    const summary = await getSummary();
    assert.equal(summary.totalIncome, 91000);
    assert.equal(summary.receivedIncome, 85000);
    assert.equal(summary.pendingIncome, 6000);
    assert.equal(summary.totalExpenses, 54200);
    assert.equal(summary.paidExpenses, 54200);
    assert.equal(summary.pendingExpenses, 0);
    assert.equal(summary.upcomingIncome, 12000);
    assert.equal(summary.availableBalance, 30800);
    assert.equal(summary.potentialBalance, 36800);
    assert.equal(summary.regularCommitments, 50700);
    assert.equal(summary.oneTimeExpenses, 3500);
  });

  it('returns the expense category breakdown and payment-method summary', async () => {
    const { body } = await api('GET', '/dashboard?month=2026-10');
    const byCategory = Object.fromEntries(
      body.data.categoryBreakdown.map((row) => [row.category, row])
    );
    assert.equal(byCategory['Property & Savings'].amount, 38000);
    assert.equal(byCategory['Property & Savings'].count, 3);
    assert.equal(byCategory['Interest & Finance'].amount, 6500);
    assert.equal(byCategory['Household & Personal'].amount, 6200);
    assert.equal(byCategory['Additional / One-Time'].amount, 3500);
    assert.deepEqual(
      body.data.paymentMethodSummary.map((row) => [row.paymentMethod, row.amount, row.count]),
      [
        ['Phone Pay', 51200, 10],
        ['UPI', 3000, 1],
      ]
    );
  });

  it('rejects an invalid month query', async () => {
    const { status, body } = await api('GET', '/dashboard?month=October');
    assert.equal(status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

describe('income', () => {
  it('changes House Rent from Pending to Received and updates the dashboard', async () => {
    const rent = await findIncome((row) => row.source === 'House Rent' && row.status === 'Pending');
    const { status, body } = await api('PATCH', `/income/${rent.id}/status`, {
      status: 'Received',
    });

    assert.equal(status, 200);
    assert.equal(body.data.status, 'Received');
    assert.notEqual(body.data.updatedAt, rent.updatedAt);

    const summary = await getSummary();
    assert.equal(summary.pendingIncome, 0);
    assert.equal(summary.receivedIncome, 91000);
    assert.equal(summary.availableBalance, 36800);

    await api('PATCH', `/income/${rent.id}/status`, { status: 'Pending' });
  });

  it('supports create, full update and delete', async () => {
    const created = await api('POST', '/income', {
      date: '2026-10-15',
      source: 'Freelance',
      amount: 2500.5,
      status: 'Pending',
      paymentMethodId: 4,
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.amount, 2500.5);
    assert.equal(created.body.data.paymentMethod, 'Bank Transfer');

    const id = created.body.data.id;
    const updated = await api('PUT', `/income/${id}`, {
      ...created.body.data,
      source: 'Freelance Project',
      status: 'Received',
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.source, 'Freelance Project');

    const removed = await api('DELETE', `/income/${id}`);
    assert.equal(removed.status, 200);
    const missing = await api('GET', `/income/${id}`);
    assert.equal(missing.status, 404);
  });

  it('returns field errors for invalid input', async () => {
    const { status, body } = await api('POST', '/income', {
      date: '2026-02-30',
      source: '  ',
      amount: 0,
      status: 'Unknown',
    });
    assert.equal(status, 400);
    assert.ok(body.error.details.date);
    assert.ok(body.error.details.source);
    assert.match(body.error.details.amount, /greater than 0/);
    assert.ok(body.error.details.status);
  });

  it('adds a month when a record is saved in it and removes it when emptied', async () => {
    const created = await api('POST', '/income', {
      date: '2026-11-01',
      source: 'Salary',
      amount: 80000,
      status: 'Pending',
    });
    let months = await api('GET', '/months');
    assert.deepEqual(months.body.data, ['2026-10', '2026-11']);

    await api('DELETE', `/income/${created.body.data.id}`);
    months = await api('GET', '/months');
    assert.deepEqual(months.body.data, ['2026-10']);
  });
});

describe('expenses', () => {
  it('changes an expense from Paid to Pending to Closed', async () => {
    const { body } = await api('GET', '/expenses?month=2026-10');
    const fuel = body.data.find((row) => row.payee === 'Fuel');

    await api('PATCH', `/expenses/${fuel.id}/status`, { status: 'Pending' });
    let summary = await getSummary();
    assert.equal(summary.pendingExpenses, 700);
    assert.equal(summary.paidExpenses, 54200 - 700);

    const closed = await api('PATCH', `/expenses/${fuel.id}/status`, { status: 'Closed' });
    assert.equal(closed.body.data.status, 'Closed');

    await api('PATCH', `/expenses/${fuel.id}/status`, { status: 'Paid' });
    summary = await getSummary();
    assert.equal(summary.paidExpenses, 54200);
  });

  it('requires a valid category and payment method', async () => {
    const { status, body } = await api('POST', '/expenses', {
      date: '2026-10-10',
      categoryId: 999,
      payee: 'Test',
      amount: 100,
      expenseType: 'Regular',
      paymentMethodId: 1,
      status: 'Paid',
    });
    assert.equal(status, 400);
    assert.ok(body.error.details.categoryId);
  });

  it('bulk-updates and bulk-deletes inside a transaction', async () => {
    const ids = [];
    for (const amount of [100, 200, 300]) {
      const created = await api('POST', '/expenses', {
        date: '2026-10-20',
        categoryId: 3,
        payee: `Bulk ${amount}`,
        amount,
        expenseType: 'Additional',
        paymentMethodId: 3,
        status: 'Pending',
      });
      ids.push(created.body.data.id);
    }

    const bulkStatus = await api('POST', '/expenses/bulk-status', { ids, status: 'Paid' });
    assert.equal(bulkStatus.status, 200);
    assert.equal(bulkStatus.body.data.updatedCount, 3);

    const { body } = await api('GET', '/dashboard?month=2026-10');
    const cash = body.data.paymentMethodSummary.find((row) => row.paymentMethod === 'Cash');
    assert.deepEqual([cash.amount, cash.count], [600, 3]);

    // One missing id rejects the whole request and changes nothing.
    const partial = await api('POST', '/expenses/bulk-delete', { ids: [...ids, 99999] });
    assert.equal(partial.status, 404);

    const bulkDelete = await api('POST', '/expenses/bulk-delete', { ids });
    assert.equal(bulkDelete.body.data.deletedCount, 3);
    assert.equal((await getSummary()).totalExpenses, 54200);
  });
});

describe('upcoming income', () => {
  it('changes Loan Interest from Expected to Received', async () => {
    const { body } = await api('GET', '/upcoming-income?month=2026-10');
    const interest = body.data.find((row) => row.source === 'Loan Interest');
    assert.equal(interest.status, 'Expected');

    const changed = await api('PATCH', `/upcoming-income/${interest.id}/status`, {
      status: 'Received',
    });
    assert.equal(changed.body.data.status, 'Received');
    assert.equal((await getSummary()).upcomingIncomeOutstanding, 9000);
  });

  it('rejects an expected date outside the selected month', async () => {
    const { status, body } = await api('POST', '/upcoming-income', {
      month: '2026-10',
      expectedDate: '2026-11-05',
      source: 'Bonus',
      amount: 1000,
      status: 'Expected',
    });
    assert.equal(status, 400);
    assert.ok(body.error.details.expectedDate);
  });
});

describe('data management and errors', () => {
  it('exports data that can be imported again', async () => {
    const exported = await fetch(`${baseUrl}/api/data/export`).then((res) => res.json());
    assert.equal(exported.expenses.length, 11);

    const imported = await api('POST', '/data/import', exported);
    assert.equal(imported.status, 200);
    assert.deepEqual(imported.body.data, { months: 1, income: 3, expenses: 11, upcomingIncome: 2 });
    assert.equal((await getSummary()).totalExpenses, 54200);
  });

  it('rejects an import file with invalid records without changing data', async () => {
    const { status } = await api('POST', '/data/import', {
      format: 'budget-manager-export',
      version: 1,
      income: [{ date: 'bad', source: 'X', amount: -1, status: 'Received' }],
    });
    assert.equal(status, 400);
    assert.equal((await getSummary()).totalIncome, 91000);
  });

  it('records an audit trail', async () => {
    const { body } = await api('GET', '/activity?limit=5');
    assert.ok(body.data.length > 0);
    assert.ok(body.data.every((entry) => entry.summary && entry.createdAt));
  });

  it('returns JSON errors for unknown routes and malformed JSON', async () => {
    const unknown = await api('GET', '/does-not-exist');
    assert.equal(unknown.status, 404);

    const response = await fetch(`${baseUrl}/api/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not json',
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_JSON');
  });
});
