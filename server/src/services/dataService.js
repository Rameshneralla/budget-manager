/**
 * Data management: JSON export, JSON import (full replace) and SQLite backups.
 *
 * The export file format is also used by the seed data
 * (database/seed-data/sample-data.json), so seeding and importing share one path.
 * Categories and payment methods are referenced by NAME in the file, never by id.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { getDb, runInTransaction } = require('../database/connection');
const incomeRepository = require('../repositories/incomeRepository');
const expenseRepository = require('../repositories/expenseRepository');
const monthRepository = require('../repositories/monthRepository');
const lookupRepository = require('../repositories/lookupRepository');
const userRepository = require('../repositories/userRepository');
const auditService = require('./auditService');
const { validateIncomeInput } = require('../validators/incomeValidator');
const { validateExpenseInput } = require('../validators/expenseValidator');
const { ValidationError } = require('../utils/errors');
const { isValidMonthKey, budgetMonthKey } = require('../utils/dates');
const { rupeesToPaise } = require('../utils/money');
const {
  EXPORT_FORMAT,
  AUDIT_ACTIONS,
  INCOME_RECEIVED_STATUS,
  DEFAULT_INCOME_TYPE,
} = require('../constants');

const MAX_REPORTED_IMPORT_ERRORS = 20;

/* ---------------------------------- Export --------------------------------- */

function exportData() {
  const owner = userRepository.findOwner();

  return {
    format: EXPORT_FORMAT.NAME,
    version: EXPORT_FORMAT.VERSION,
    exportedAt: new Date().toISOString(),
    owner: owner ? owner.fullName : null,
    months: monthRepository.findAllKeys(),
    income: incomeRepository.findAll().map((income) => ({
      incomeType: income.incomeType,
      dueDate: income.dueDate,
      receivedDate: income.receivedDate,
      source: income.source,
      amount: income.amount,
      purpose: income.purpose,
      status: income.status,
      paymentMethod: income.paymentMethod,
      reference: income.reference,
      notes: income.notes,
    })),
    expenses: expenseRepository.findAll().map((expense) => ({
      dueDate: expense.dueDate,
      paidDate: expense.paidDate,
      category: expense.category,
      payee: expense.payee,
      amount: expense.amount,
      purpose: expense.purpose,
      expenseType: expense.expenseType,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference,
      endPeriod: expense.endPeriod,
      status: expense.status,
      notes: expense.notes,
    })),
  };
}

/* ---------------------------------- Import --------------------------------- */

function buildNameLookup(rows) {
  return new Map(rows.map((row) => [row.name.toLowerCase(), row.id]));
}

/** Collects per-item errors as { 'expenses[3].amount': 'Amount must be greater than 0.' } */
class ImportErrorCollector {
  constructor() {
    this.errors = {};
  }

  add(key, message) {
    if (Object.keys(this.errors).length < MAX_REPORTED_IMPORT_ERRORS) {
      this.errors[key] = message;
    }
  }

  /** Runs a validator and records its field errors under `prefix`. */
  validate(prefix, validate, input) {
    try {
      return validate(input);
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        throw error;
      }
      Object.entries(error.details).forEach(([field, message]) =>
        this.add(`${prefix}.${field}`, message)
      );
      return null;
    }
  }

  throwIfAny() {
    if (Object.keys(this.errors).length > 0) {
      throw new ValidationError(this.errors, 'The import file contains invalid records.');
    }
  }
}

function resolveName(collector, key, lookup, name, label, { required }) {
  if (name === undefined || name === null || String(name).trim() === '') {
    if (required) {
      collector.add(key, `${label} is required.`);
    }
    return null;
  }
  const id = lookup.get(String(name).trim().toLowerCase());
  if (!id) {
    collector.add(key, `Unknown ${label.toLowerCase()} "${name}".`);
    return null;
  }
  return id;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/** Version 1 files had one "date" per income/expense; it is the due date. */
function upgradeDatedItems(items, version) {
  if (version >= 2) {
    return items;
  }
  return items.map((item) =>
    item && typeof item === 'object' ? { dueDate: item.date, ...item } : item
  );
}

/**
 * Versions 1-3 had no income type: work it out from the source name the same
 * way migration 005 does ("salary" -> Salary, the word "rent" -> House Rent).
 */
function inferIncomeType(source) {
  const text = ` ${String(source ?? '')
    .trim()
    .toLowerCase()} `;
  if (text.includes('salary')) {
    return 'Salary';
  }
  return text.includes(' rent ') ? 'House Rent' : DEFAULT_INCOME_TYPE;
}

function upgradeIncomeType(items, version) {
  if (version >= 4) {
    return items;
  }
  return items.map((item) =>
    item && typeof item === 'object' ? { incomeType: inferIncomeType(item.source), ...item } : item
  );
}

/** Income status "Pending" (versions 1-2) is now "Expected". */
function upgradeIncomeStatus(items, version) {
  if (version >= 3) {
    return items;
  }
  return items.map((item) =>
    item && typeof item === 'object' && item.status === 'Pending'
      ? { ...item, status: 'Expected' }
      : item
  );
}

function isSameMonthAndSource(income, upcoming) {
  return (
    typeof income?.dueDate === 'string' &&
    income.dueDate.slice(0, 7) === upcoming.month &&
    String(income.source ?? '')
      .trim()
      .toLowerCase() ===
      String(upcoming.source ?? '')
        .trim()
        .toLowerCase()
  );
}

/** Same amount as one matching income record, or as all of them together (e.g. two rents). */
function isAlreadyInIncome(income, upcoming) {
  const matches = income.filter((item) => isSameMonthAndSource(item, upcoming));
  const amount = rupeesToPaise(Number(upcoming.amount));
  const amounts = matches.map((item) => rupeesToPaise(Number(item.amount)));
  const total = amounts.reduce((sum, value) => sum + value, 0);
  return matches.length > 0 && (amounts.includes(amount) || total === amount);
}

/**
 * Versions 1-2 had a separate "upcomingIncome" list. Each entry becomes an
 * income record (Received stays Received, anything else is Expected) unless it
 * is already in the income list: linked to it (incomeIndex), or the same month
 * and source with the same amount (see isAlreadyInIncome).
 */
function upcomingToIncome(upcomingItems, income) {
  return upcomingItems
    .filter((item) => item && typeof item === 'object')
    .filter((item) => item.incomeIndex === undefined || item.incomeIndex === null)
    .filter((item) => !isAlreadyInIncome(income, item))
    .map((item) => {
      const isReceived = item.status === INCOME_RECEIVED_STATUS;
      return {
        dueDate: item.expectedDate || `${item.month}-01`,
        receivedDate: isReceived ? (item.expectedDate ?? null) : null,
        source: item.source,
        amount: item.amount,
        purpose: item.purpose ?? null,
        status: isReceived ? INCOME_RECEIVED_STATUS : 'Expected',
        reference: 'Moved from Upcoming Income',
        notes: item.notes ?? null,
      };
    });
}

function validateImportFile(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError({ file: 'The import file must contain a JSON object.' });
  }
  if (
    payload.format !== EXPORT_FORMAT.NAME ||
    !EXPORT_FORMAT.SUPPORTED_VERSIONS.includes(payload.version)
  ) {
    throw new ValidationError({
      file: 'This file was not exported from Budget Manager (unknown format or version).',
    });
  }

  const collector = new ImportErrorCollector();
  const categoryIds = buildNameLookup(lookupRepository.findAllCategories());
  const paymentMethodIds = buildNameLookup(lookupRepository.findAllPaymentMethods());

  const months = asArray(payload.months);
  months.forEach((monthKey, index) => {
    if (!isValidMonthKey(monthKey)) {
      collector.add(`months[${index}]`, 'Month must be in YYYY-MM format.');
    }
  });

  const fileIncome = upgradeIncomeStatus(
    upgradeDatedItems(asArray(payload.income), payload.version),
    payload.version
  );
  const rawIncome = upgradeIncomeType(
    [...fileIncome, ...upcomingToIncome(asArray(payload.upcomingIncome), fileIncome)],
    payload.version
  );
  const income = rawIncome.map((item, index) => {
    const prefix = `income[${index}]`;
    const paymentMethodId = resolveName(
      collector,
      `${prefix}.paymentMethod`,
      paymentMethodIds,
      item?.paymentMethod,
      'Payment method',
      { required: false }
    );
    return collector.validate(prefix, validateIncomeInput, { ...item, paymentMethodId });
  });

  const rawExpenses = upgradeDatedItems(asArray(payload.expenses), payload.version);
  const expenses = rawExpenses.map((item, index) => {
    const prefix = `expenses[${index}]`;
    const categoryId = resolveName(
      collector,
      `${prefix}.category`,
      categoryIds,
      item?.category,
      'Category',
      {
        required: true,
      }
    );
    const paymentMethodId = resolveName(
      collector,
      `${prefix}.paymentMethod`,
      paymentMethodIds,
      item?.paymentMethod,
      'Payment method',
      { required: true }
    );
    return collector.validate(prefix, validateExpenseInput, {
      ...item,
      categoryId,
      paymentMethodId,
    });
  });

  collector.throwIfAny();
  return { months, income, expenses };
}

function collectMonthKeys({ months, income, expenses }) {
  const monthKeys = new Set(months);
  income.forEach((item) => monthKeys.add(budgetMonthKey(item.receivedDate, item.dueDate)));
  expenses.forEach((item) => monthKeys.add(budgetMonthKey(item.paidDate, item.dueDate)));
  return [...monthKeys].sort();
}

/**
 * Replaces ALL budget data with the contents of `payload` in one transaction.
 * If anything fails, nothing is changed. Lookups and audit history are kept.
 */
function importData(payload, { source = 'import file' } = {}) {
  const data = validateImportFile(payload);
  const monthKeys = collectMonthKeys(data);

  return runInTransaction(() => {
    incomeRepository.deleteAll();
    expenseRepository.deleteAll();
    monthRepository.deleteAll();

    monthKeys.forEach((monthKey) => monthRepository.ensureExists(monthKey));
    data.income.forEach((item) =>
      incomeRepository.create({ ...item, month: budgetMonthKey(item.receivedDate, item.dueDate) })
    );
    data.expenses.forEach((item) =>
      expenseRepository.create({ ...item, month: budgetMonthKey(item.paidDate, item.dueDate) })
    );

    const counts = {
      months: monthKeys.length,
      income: data.income.length,
      expenses: data.expenses.length,
    };

    auditService.log({
      entityType: 'data',
      action: AUDIT_ACTIONS.IMPORTED,
      summary: `Data imported from ${source}: ${counts.income} income, ${counts.expenses} expenses`,
      details: counts,
    });

    return counts;
  });
}

function isDatabaseEmpty() {
  return (
    monthRepository.findAllKeys().length === 0 &&
    incomeRepository.countAll() === 0 &&
    expenseRepository.countAll() === 0
  );
}

/* ---------------------------------- Backup --------------------------------- */

function buildBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `budget-backup-${timestamp}.sqlite`;
}

/**
 * Writes a consistent copy of the live database into BACKUP_DIR using
 * SQLite's online backup API (safe while the app is running).
 */
async function backupDatabase() {
  fs.mkdirSync(env.backupDir, { recursive: true });
  const fileName = buildBackupFileName();
  await getDb().backup(path.join(env.backupDir, fileName));

  return {
    fileName,
    folder: path.basename(env.backupDir),
    createdAt: new Date().toISOString(),
  };
}

module.exports = { exportData, importData, isDatabaseEmpty, backupDatabase };
