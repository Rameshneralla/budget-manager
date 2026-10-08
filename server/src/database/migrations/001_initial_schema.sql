-- =====================================================================
-- 001_initial_schema.sql
-- Initial relational schema for the Personal Budget Manager.
--
-- Conventions
--   * Money is stored as INTEGER paise (amount_paise) so totals are exact.
--     Repositories convert to/from rupees; the API always speaks rupees.
--   * Dates are ISO strings: YYYY-MM-DD. Months are YYYY-MM (month_key).
--   * Timestamps are ISO-8601 UTC strings (created_at / updated_at).
--   * Totals are NEVER stored - they are calculated from records on demand.
--
-- To change the schema later, add a NEW file (002_xxx.sql). Never edit an
-- applied migration. See README > "Database migrations".
-- =====================================================================

-- Owner profile. Single row today; ready for multi-user support later.
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  app_title     TEXT    NOT NULL DEFAULT 'Personal Budget Manager',
  currency_code TEXT    NOT NULL DEFAULT 'INR',
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Budget months that exist. The month dropdown is built from this table,
-- so a month appears only once data is recorded for it.
CREATE TABLE months (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  month_key  TEXT    NOT NULL UNIQUE
             CHECK (month_key GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE payment_methods (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- month_key is derived from transaction_date by the service layer. It is kept
-- as a column so every record links to a row in `months` (FK) and month
-- queries stay a simple indexed equality lookup.
CREATE TABLE income (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  month_key         TEXT    NOT NULL REFERENCES months (month_key) ON UPDATE CASCADE,
  transaction_date  TEXT    NOT NULL,
  source            TEXT    NOT NULL,
  amount_paise      INTEGER NOT NULL CHECK (amount_paise > 0),
  purpose           TEXT,
  status            TEXT    NOT NULL CHECK (status IN ('Received', 'Pending')),
  payment_method_id INTEGER REFERENCES payment_methods (id) ON DELETE RESTRICT,
  reference         TEXT,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE expenses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  month_key         TEXT    NOT NULL REFERENCES months (month_key) ON UPDATE CASCADE,
  transaction_date  TEXT    NOT NULL,
  category_id       INTEGER NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  payee             TEXT    NOT NULL,
  amount_paise      INTEGER NOT NULL CHECK (amount_paise > 0),
  purpose           TEXT,
  expense_type      TEXT    NOT NULL CHECK (expense_type IN ('Regular', 'Additional')),
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods (id) ON DELETE RESTRICT,
  reference         TEXT,
  -- Free text such as '2038', 'Nov-2027' or 'Closed' (as recorded in the source sheet).
  end_period        TEXT,
  status            TEXT    NOT NULL CHECK (status IN ('Paid', 'Pending', 'Closed')),
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- expected_date is optional: upcoming income is often known only by month.
CREATE TABLE upcoming_income (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  month_key     TEXT    NOT NULL REFERENCES months (month_key) ON UPDATE CASCADE,
  expected_date TEXT,
  source        TEXT    NOT NULL,
  amount_paise  INTEGER NOT NULL CHECK (amount_paise > 0),
  purpose       TEXT,
  status        TEXT    NOT NULL CHECK (status IN ('Expected', 'Pending', 'Received')),
  notes         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- History of changes. `details` holds a small JSON payload (before/after values).
CREATE TABLE audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT    NOT NULL,
  entity_id   INTEGER,
  action      TEXT    NOT NULL,
  summary     TEXT    NOT NULL,
  details     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Indexes for the filters the app uses most: month, date, status, category, payment method.
CREATE INDEX idx_income_month          ON income (month_key);
CREATE INDEX idx_income_date           ON income (transaction_date);
CREATE INDEX idx_income_status         ON income (status);
CREATE INDEX idx_income_payment_method ON income (payment_method_id);

CREATE INDEX idx_expenses_month          ON expenses (month_key);
CREATE INDEX idx_expenses_date           ON expenses (transaction_date);
CREATE INDEX idx_expenses_status         ON expenses (status);
CREATE INDEX idx_expenses_category       ON expenses (category_id);
CREATE INDEX idx_expenses_payment_method ON expenses (payment_method_id);

CREATE INDEX idx_upcoming_income_month  ON upcoming_income (month_key);
CREATE INDEX idx_upcoming_income_status ON upcoming_income (status);

CREATE INDEX idx_audit_logs_created ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_entity  ON audit_logs (entity_type, entity_id);

-- Reference data (lookup values, not financial transactions).
INSERT INTO users (full_name, app_title, currency_code)
VALUES ('Ramesh Nerella', 'Personal Budget Manager', 'INR');

INSERT INTO categories (name, description, sort_order) VALUES
  ('Property & Savings',    'EMIs, chits and long-term savings', 1),
  ('Interest & Finance',    'Interest payments and finance charges', 2),
  ('Household & Personal',  'Bills, family and day-to-day spending', 3),
  ('Additional / One-Time', 'Non-recurring expenses', 4);

INSERT INTO payment_methods (name, sort_order) VALUES
  ('Phone Pay', 1),
  ('UPI', 2),
  ('Cash', 3),
  ('Bank Transfer', 4),
  ('Card', 5),
  ('Other', 6);
