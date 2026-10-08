-- =====================================================================
-- 004_month_follows_actual_date.sql
-- A record now belongs to the month the money actually moved: the paid date
-- (expenses) or received date (income) when it is set, otherwise the due date.
-- e.g. due in August but paid in October -> counted in October.
-- Moves existing records accordingly and removes months left empty.
-- =====================================================================

INSERT OR IGNORE INTO months (month_key)
SELECT substr(paid_date, 1, 7) FROM expenses WHERE paid_date IS NOT NULL
UNION
SELECT substr(received_date, 1, 7) FROM income WHERE received_date IS NOT NULL;

UPDATE expenses
SET month_key = substr(paid_date, 1, 7)
WHERE paid_date IS NOT NULL AND month_key <> substr(paid_date, 1, 7);

UPDATE income
SET month_key = substr(received_date, 1, 7)
WHERE received_date IS NOT NULL AND month_key <> substr(received_date, 1, 7);

DELETE FROM months
WHERE month_key NOT IN (SELECT month_key FROM income UNION SELECT month_key FROM expenses);
