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
    assert.equal(summary.totalIncome, 103000);
    assert.equal(summary.receivedIncome, 85000);
    assert.equal(summary.expectedIncome, 18000);
    assert.equal(summary.totalExpenses, 54200);
    assert.equal(summary.paidExpenses, 54200);
    assert.equal(summary.pendingExpenses, 0);
    assert.equal(summary.availableBalance, 30800);
    assert.equal(summary.potentialBalance, 48800);
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
  it('changes House Rent from Expected to Received and updates the dashboard', async () => {
    const rent = await findIncome(
      (row) => row.source === 'House Rent' && row.status === 'Expected'
    );
    const { status, body } = await api('PATCH', `/income/${rent.id}/status`, {
      status: 'Received',
    });

    assert.equal(status, 200);
    assert.equal(body.data.status, 'Received');
    assert.notEqual(body.data.updatedAt, rent.updatedAt);

    const summary = await getSummary();
    assert.equal(summary.expectedIncome, 12000);
    assert.equal(summary.receivedIncome, 91000);
    assert.equal(summary.availableBalance, 36800);

    await api('PATCH', `/income/${rent.id}/status`, { status: 'Expected' });
  });

  it('supports create, full update and delete', async () => {
    const created = await api('POST', '/income', {
      incomeType: 'Other Income',
      dueDate: '2026-10-15',
      source: 'Freelance',
      amount: 2500.5,
      status: 'Expected',
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

  it('fills the actual received date when marked Received and clears it when Expected', async () => {
    const rent = await findIncome(
      (row) => row.source === 'House Rent' && row.status === 'Expected'
    );
    assert.equal(rent.receivedDate, null);

    const received = await api('PATCH', `/income/${rent.id}/status`, { status: 'Received' });
    assert.match(received.body.data.receivedDate, /^\d{4}-\d{2}-\d{2}$/);

    const expected = await api('PATCH', `/income/${rent.id}/status`, { status: 'Expected' });
    assert.equal(expected.body.data.receivedDate, null);
  });

  it('only allows an actual received date when the status is Received', async () => {
    const { status, body } = await api('POST', '/income', {
      incomeType: 'Other Income',
      dueDate: '2026-10-20',
      receivedDate: '2026-10-21',
      source: 'Bonus',
      amount: 1000,
      status: 'Expected',
    });
    assert.equal(status, 400);
    assert.match(body.error.details.receivedDate, /only be set when the status is Received/);
  });

  it('only offers Expected and Received as income statuses', async () => {
    const meta = await api('GET', '/meta');
    assert.deepEqual(meta.body.data.statuses.income, ['Expected', 'Received']);

    const { status, body } = await api('POST', '/income', {
      incomeType: 'Other Income',
      dueDate: '2026-10-20',
      source: 'Bonus',
      amount: 1000,
      status: 'Pending',
    });
    assert.equal(status, 400);
    assert.ok(body.error.details.status);
  });

  it('groups income as Salary, House Rent or Other Income', async () => {
    const meta = (await api('GET', '/meta')).body.data;
    assert.deepEqual(meta.incomeTypes, ['Salary', 'House Rent', 'Other Income']);
    const methods = meta.paymentMethods.map((method) => method.name);
    assert.ok(methods.includes('GPay') && methods.includes('Paytm'));

    const rows = (await api('GET', '/income?month=2026-10')).body.data;
    assert.deepEqual(rows.map((row) => `${row.incomeType}: ${row.source}`).sort(), [
      'House Rent: House Rent',
      'House Rent: House Rent',
      'Other Income: Freelance Project',
      'Other Income: Loan Interest',
      'Salary: Salary',
    ]);

    const gpay = meta.paymentMethods.find((method) => method.name === 'GPay');
    const created = await api('POST', '/income', {
      incomeType: 'Other Income',
      dueDate: '2026-10-12',
      receivedDate: '2026-10-12',
      source: 'Friend returned loan',
      amount: 1500,
      status: 'Received',
      paymentMethodId: gpay.id,
    });
    assert.equal(created.status, 201);
    assert.deepEqual(
      [created.body.data.incomeType, created.body.data.paymentMethod],
      ['Other Income', 'GPay']
    );
    await api('DELETE', `/income/${created.body.data.id}`);

    const missingType = await api('POST', '/income', {
      dueDate: '2026-10-12',
      source: 'X',
      amount: 10,
      status: 'Received',
    });
    assert.equal(missingType.status, 400);
    assert.ok(missingType.body.error.details.incomeType);
  });

  it('returns field errors for invalid input', async () => {
    const { status, body } = await api('POST', '/income', {
      dueDate: '2026-02-30',
      source: '  ',
      amount: 0,
      status: 'Unknown',
    });
    assert.equal(status, 400);
    assert.ok(body.error.details.dueDate);
    assert.ok(body.error.details.source);
    assert.match(body.error.details.amount, /greater than 0/);
    assert.ok(body.error.details.status);
  });

  it('adds a month when a record is saved in it and removes it when emptied', async () => {
    const created = await api('POST', '/income', {
      incomeType: 'Salary',
      dueDate: '2026-11-01',
      source: 'Salary',
      amount: 80000,
      status: 'Expected',
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

  it('keeps the actual paid date in step with the status', async () => {
    const { body } = await api('GET', '/expenses?month=2026-10');
    const internet = body.data.find((row) => row.payee === 'Internet');
    assert.equal(internet.paidDate, '2026-10-05');

    const pending = await api('PATCH', `/expenses/${internet.id}/status`, { status: 'Pending' });
    assert.equal(pending.body.data.paidDate, null);
    const paid = await api('PATCH', `/expenses/${internet.id}/status`, { status: 'Paid' });
    assert.match(paid.body.data.paidDate, /^\d{4}-\d{2}-\d{2}$/);

    const invalid = await api('PUT', `/expenses/${internet.id}`, {
      ...paid.body.data,
      status: 'Pending',
    });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.error.details.paidDate);
    await api('PUT', `/expenses/${internet.id}`, { ...paid.body.data, paidDate: '2026-10-05' });
  });

  it('counts an expense in the month it was paid, not the month it was due', async () => {
    const totalBefore = (await getSummary()).totalExpenses;
    const created = await api('POST', '/expenses', {
      dueDate: '2026-08-20',
      categoryId: 3,
      payee: 'Late Bill',
      amount: 900,
      expenseType: 'Additional',
      paymentMethodId: 3,
      status: 'Pending',
    });
    // Not paid yet: it sits in its due month (August).
    assert.equal(created.body.data.month, '2026-08');
    assert.deepEqual((await api('GET', '/months')).body.data, ['2026-08', '2026-10']);

    // Paid in October: it moves to October and August disappears.
    const paid = await api('PUT', `/expenses/${created.body.data.id}`, {
      ...created.body.data,
      status: 'Paid',
      paidDate: '2026-10-03',
    });
    assert.equal(paid.body.data.month, '2026-10');
    assert.equal(paid.body.data.dueDate, '2026-08-20');
    assert.deepEqual((await api('GET', '/months')).body.data, ['2026-10']);
    assert.equal((await getSummary()).totalExpenses, totalBefore + 900);

    // Back to Pending (paid date cleared): back to August.
    const pending = await api('PATCH', `/expenses/${created.body.data.id}/status`, {
      status: 'Pending',
    });
    assert.equal(pending.body.data.month, '2026-08');
    assert.equal((await getSummary()).totalExpenses, totalBefore);

    await api('DELETE', `/expenses/${created.body.data.id}`);
    assert.deepEqual((await api('GET', '/months')).body.data, ['2026-10']);
  });

  it('counts income in the month it was received', async () => {
    const created = await api('POST', '/income', {
      incomeType: 'House Rent',
      dueDate: '2026-09-25',
      receivedDate: '2026-10-02',
      source: 'Late Rent',
      amount: 1200,
      status: 'Received',
    });
    assert.equal(created.body.data.month, '2026-10');
    await api('DELETE', `/income/${created.body.data.id}`);
  });

  it('requires a valid category and payment method', async () => {
    const { status, body } = await api('POST', '/expenses', {
      dueDate: '2026-10-10',
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
        dueDate: '2026-10-20',
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

describe('upcoming income (now Income with status Expected)', () => {
  it('no longer has a separate upcoming-income API', async () => {
    const { status } = await api('GET', '/upcoming-income?month=2026-10');
    assert.equal(status, 404);
  });

  it('bulk-marks expected income Received and back, updating the dashboard', async () => {
    const { body } = await api('GET', '/income?month=2026-10');
    const ids = body.data.filter((row) => row.status === 'Expected').map((row) => row.id);
    assert.equal(ids.length, 3);

    await api('POST', '/income/bulk-status', { ids, status: 'Received' });
    let summary = await getSummary();
    assert.equal(summary.expectedIncome, 0);
    assert.equal(summary.receivedIncome, 103000);

    await api('POST', '/income/bulk-status', { ids, status: 'Expected' });
    summary = await getSummary();
    assert.equal(summary.expectedIncome, 18000);
    assert.equal(summary.receivedIncome, 85000);
  });
});

describe('data management and errors', () => {
  it('exports data that can be imported again', async () => {
    const exported = await fetch(`${baseUrl}/api/data/export`).then((res) => res.json());
    assert.equal(exported.expenses.length, 11);

    const imported = await api('POST', '/data/import', exported);
    assert.equal(imported.status, 200);
    assert.deepEqual(imported.body.data, { months: 1, income: 5, expenses: 11 });
    assert.equal(exported.version, 4);
    assert.equal(exported.upcomingIncome, undefined);
    assert.equal((await getSummary()).totalExpenses, 54200);
  });

  it('imports version 2 files: Pending -> Expected, upcoming income -> income', async () => {
    const current = await fetch(`${baseUrl}/api/data/export`).then((res) => res.json());
    // Version 2 had no income type.
    const withoutType = current.income.map(({ incomeType: _type, ...row }) => row);
    const base = withoutType.filter(
      (row) => !['Freelance Project', 'Loan Interest'].includes(row.source)
    );
    const salary = withoutType.find((row) => row.source === 'Salary');
    const versionTwo = {
      ...current,
      version: 2,
      income: [
        ...base.map((row) => (row.status === 'Expected' ? { ...row, status: 'Pending' } : row)),
        { ...salary, source: 'Bonus', amount: 700 },
      ],
      upcomingIncome: [
        // Not in Income yet: moves across as Expected.
        { month: '2026-10', source: 'Freelance Project', amount: 9000, status: 'Pending' },
        {
          month: '2026-10',
          expectedDate: '2026-10-28',
          source: 'Loan Interest',
          amount: 3000,
          status: 'Expected',
        },
        // Already in Income: linked by incomeIndex, or same month + source + amount.
        {
          month: '2026-10',
          source: 'Bonus',
          amount: 700,
          status: 'Received',
          incomeIndex: base.length,
        },
        { month: '2026-10', source: 'house rent', amount: 6000, status: 'Pending' },
        { month: '2026-10', source: 'House Rent', amount: 11000, status: 'Expected' }, // 5,000 + 6,000
      ],
    };
    const imported = await api('POST', '/data/import', versionTwo);
    assert.equal(imported.status, 200);
    assert.equal(imported.body.data.income, 6);

    const rows = (await api('GET', '/income?month=2026-10')).body.data;
    const freelance = rows.find((row) => row.source === 'Freelance Project');
    assert.deepEqual([freelance.status, freelance.dueDate], ['Expected', '2026-10-01']);
    assert.equal(rows.find((row) => row.source === 'Loan Interest').dueDate, '2026-10-28');
    assert.equal(rows.filter((row) => row.source === 'Bonus').length, 1);
    assert.equal(rows.filter((row) => row.amount === 6000).length, 1);
    assert.equal((await getSummary()).expectedIncome, 18000);
    // Income type worked out from the source name.
    const typeOf = (source) => rows.find((row) => row.source === source).incomeType;
    assert.deepEqual(['Salary', 'House Rent', 'Freelance Project', 'Bonus'].map(typeOf), [
      'Salary',
      'House Rent',
      'Other Income',
      'Other Income',
    ]);

    await api('POST', '/data/import', current);
  });

  it('still imports version 1 files (one "date" per record = due date)', async () => {
    const current = await fetch(`${baseUrl}/api/data/export`).then((res) => res.json());
    const versionOne = {
      ...current,
      version: 1,
      income: current.income.map(({ dueDate, receivedDate: _r, ...rest }) => ({
        ...rest,
        date: dueDate,
      })),
      expenses: current.expenses.map(({ dueDate, paidDate: _p, ...rest }) => ({
        ...rest,
        date: dueDate,
      })),
    };
    const imported = await api('POST', '/data/import', versionOne);
    assert.equal(imported.status, 200);
    const salary = await findIncome((row) => row.source === 'Salary');
    assert.equal(salary.dueDate, '2026-10-01');
    assert.equal(salary.receivedDate, null);
    assert.equal((await getSummary()).totalExpenses, 54200);

    await api('POST', '/data/import', current); // restore actual dates for later tests
  });

  it('rejects an import file with invalid records without changing data', async () => {
    const { status } = await api('POST', '/data/import', {
      format: 'budget-manager-export',
      version: 1,
      income: [{ date: 'bad', source: 'X', amount: -1, status: 'Received' }],
    });
    assert.equal(status, 400);
    assert.equal((await getSummary()).totalIncome, 103000);
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
