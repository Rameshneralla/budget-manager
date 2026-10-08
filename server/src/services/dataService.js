/**
 * Data management: JSON export, JSON import (full replace) and SQLite backups.
 *
 * The export file format is also used by the seed data
 * (database/seed-data/october-2026.json), so seeding and importing share one path.
 * Categories and payment methods are referenced by NAME in the file, never by id.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { getDb, runInTransaction } = require('../database/connection');
const incomeRepository = require('../repositories/incomeRepository');
const expenseRepository = require('../repositories/expenseRepository');
const upcomingIncomeRepository = require('../repositories/upcomingIncomeRepository');
const monthRepository = require('../repositories/monthRepository');
const lookupRepository = require('../repositories/lookupRepository');
const userRepository = require('../repositories/userRepository');
const auditService = require('./auditService');
const { validateIncomeInput } = require('../validators/incomeValidator');
const { validateExpenseInput } = require('../validators/expenseValidator');
const { validateUpcomingIncomeInput } = require('../validators/upcomingIncomeValidator');
const { ValidationError } = require('../utils/errors');
const { isValidMonthKey, monthKeyFromDate } = require('../utils/dates');
const { EXPORT_FORMAT, AUDIT_ACTIONS } = require('../constants');

const MAX_REPORTED_IMPORT_ERRORS = 20;

/* ---------------------------------- Export --------------------------------- */

function exportData() {
  const owner = userRepository.findOwner();
  const allIncome = incomeRepository.findAll();
  // Upcoming income -> income links are written as positions in the income list,
  // because database ids are not kept when a file is imported.
  const incomePositionById = new Map(allIncome.map((income, index) => [income.id, index]));

  return {
    format: EXPORT_FORMAT.NAME,
    version: EXPORT_FORMAT.VERSION,
    exportedAt: new Date().toISOString(),
    owner: owner ? owner.fullName : null,
    months: monthRepository.findAllKeys(),
    income: allIncome.map((income) => ({
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
    upcomingIncome: upcomingIncomeRepository.findAll().map((upcoming) => ({
      month: upcoming.month,
      expectedDate: upcoming.expectedDate,
      source: upcoming.source,
      amount: upcoming.amount,
      purpose: upcoming.purpose,
      status: upcoming.status,
      notes: upcoming.notes,
      incomeIndex: incomePositionById.get(upcoming.incomeId) ?? null,
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

function validateIncomeIndex(collector, key, incomeIndex, incomeCount) {
  if (incomeIndex === undefined || incomeIndex === null) {
    return null;
  }
  if (!Number.isInteger(incomeIndex) || incomeIndex < 0 || incomeIndex >= incomeCount) {
    collector.add(key, 'Linked income does not exist in this file.');
    return null;
  }
  return incomeIndex;
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

  const rawIncome = upgradeDatedItems(asArray(payload.income), payload.version);
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

  const upcomingIncome = asArray(payload.upcomingIncome).map((item, index) => {
    const prefix = `upcomingIncome[${index}]`;
    const validated = collector.validate(prefix, validateUpcomingIncomeInput, item);
    const incomeIndex = validateIncomeIndex(
      collector,
      `${prefix}.incomeIndex`,
      item?.incomeIndex,
      rawIncome.length
    );
    return validated && { ...validated, incomeIndex };
  });

  collector.throwIfAny();
  return { months, income, expenses, upcomingIncome };
}

function collectMonthKeys({ months, income, expenses, upcomingIncome }) {
  const monthKeys = new Set(months);
  income.forEach((item) => monthKeys.add(monthKeyFromDate(item.dueDate)));
  expenses.forEach((item) => monthKeys.add(monthKeyFromDate(item.dueDate)));
  upcomingIncome.forEach((item) => monthKeys.add(item.month));
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
    upcomingIncomeRepository.deleteAll();
    incomeRepository.deleteAll();
    expenseRepository.deleteAll();
    monthRepository.deleteAll();

    monthKeys.forEach((monthKey) => monthRepository.ensureExists(monthKey));
    const createdIncomeIds = data.income.map(
      (item) => incomeRepository.create({ ...item, month: monthKeyFromDate(item.dueDate) }).id
    );
    data.expenses.forEach((item) =>
      expenseRepository.create({ ...item, month: monthKeyFromDate(item.dueDate) })
    );
    data.upcomingIncome.forEach(({ incomeIndex, ...item }) => {
      const created = upcomingIncomeRepository.create(item);
      if (incomeIndex !== null) {
        upcomingIncomeRepository.setIncomeId(created.id, createdIncomeIds[incomeIndex]);
      }
    });

    const counts = {
      months: monthKeys.length,
      income: data.income.length,
      expenses: data.expenses.length,
      upcomingIncome: data.upcomingIncome.length,
    };

    auditService.log({
      entityType: 'data',
      action: AUDIT_ACTIONS.IMPORTED,
      summary: `Data imported from ${source}: ${counts.income} income, ${counts.expenses} expenses, ${counts.upcomingIncome} upcoming income`,
      details: counts,
    });

    return counts;
  });
}

function isDatabaseEmpty() {
  return (
    monthRepository.findAllKeys().length === 0 &&
    incomeRepository.countAll() === 0 &&
    expenseRepository.countAll() === 0 &&
    upcomingIncomeRepository.countAll() === 0
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
