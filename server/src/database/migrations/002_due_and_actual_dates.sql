-- =====================================================================
-- 002_due_and_actual_dates.sql
--
-- * Income and expenses get two dates:
--     due_date       when the money is due (was transaction_date; decides the month)
--     received_date  income: when it was actually received   (optional)
--     paid_date      expense: when it was actually paid      (optional)
-- * Upcoming income can be linked to the income record created when it is
--   marked Received (income_id). Deleting that income clears the link.
--
-- Existing records keep their date as the due date; actual dates start empty.
-- =====================================================================

ALTER TABLE income RENAME COLUMN transaction_date TO due_date;
ALTER TABLE income ADD COLUMN received_date TEXT;

ALTER TABLE expenses RENAME COLUMN transaction_date TO due_date;
ALTER TABLE expenses ADD COLUMN paid_date TEXT;

ALTER TABLE upcoming_income ADD COLUMN income_id INTEGER REFERENCES income (id) ON DELETE SET NULL;
CREATE INDEX idx_upcoming_income_income ON upcoming_income (income_id);
