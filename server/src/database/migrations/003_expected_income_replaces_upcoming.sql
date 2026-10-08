-- =====================================================================
-- 003_expected_income_replaces_upcoming.sql
-- Income now has two statuses: Expected (not received yet) and Received.
-- The separate Upcoming Income list is folded into Income:
--   * income 'Pending' becomes 'Expected'
--   * upcoming income not already in Income moves across as an income record
--     (Received stays Received, everything else becomes Expected). Rows that
--     were added to Income by "Received", or that are already in Income (same
--     month and source, and the same amount as one record or as all of them
--     together), are not copied again.
--   * the upcoming_income table is removed.
-- SQLite cannot change a CHECK constraint in place, so `income` is rebuilt.
-- =====================================================================

CREATE TABLE income_new (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  month_key         TEXT    NOT NULL REFERENCES months (month_key) ON UPDATE CASCADE,
  due_date          TEXT    NOT NULL,
  received_date     TEXT,
  source            TEXT    NOT NULL,
  amount_paise      INTEGER NOT NULL CHECK (amount_paise > 0),
  purpose           TEXT,
  status            TEXT    NOT NULL CHECK (status IN ('Expected', 'Received')),
  payment_method_id INTEGER REFERENCES payment_methods (id) ON DELETE RESTRICT,
  reference         TEXT,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO income_new (id, month_key, due_date, received_date, source, amount_paise, purpose,
                        status, payment_method_id, reference, notes, created_at, updated_at)
SELECT id, month_key, due_date, received_date, source, amount_paise, purpose,
       CASE WHEN status = 'Received' THEN 'Received' ELSE 'Expected' END,
       payment_method_id, reference, notes, created_at, updated_at
FROM income;

INSERT INTO income_new (month_key, due_date, received_date, source, amount_paise, purpose,
                        status, reference, notes, created_at, updated_at)
SELECT u.month_key,
       COALESCE(u.expected_date, u.month_key || '-01'),
       CASE WHEN u.status = 'Received' THEN u.expected_date END,
       u.source, u.amount_paise, u.purpose,
       CASE WHEN u.status = 'Received' THEN 'Received' ELSE 'Expected' END,
       'Moved from Upcoming Income', u.notes, u.created_at, u.updated_at
FROM upcoming_income u
WHERE u.income_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM income i
    WHERE i.month_key = u.month_key
      AND lower(trim(i.source)) = lower(trim(u.source))
      AND i.amount_paise = u.amount_paise
  )
  -- e.g. upcoming "House Rent 7,700" when Income already has rents of 3,200 + 4,500
  AND u.amount_paise IS NOT (
    SELECT SUM(i.amount_paise) FROM income i
    WHERE i.month_key = u.month_key
      AND lower(trim(i.source)) = lower(trim(u.source))
  )
ORDER BY u.id;

DROP TABLE upcoming_income;
DROP TABLE income;
ALTER TABLE income_new RENAME TO income;

CREATE INDEX idx_income_month          ON income (month_key);
CREATE INDEX idx_income_date           ON income (due_date);
CREATE INDEX idx_income_status         ON income (status);
CREATE INDEX idx_income_payment_method ON income (payment_method_id);
