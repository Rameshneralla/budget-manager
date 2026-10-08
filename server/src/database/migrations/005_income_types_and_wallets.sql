-- =====================================================================
-- 005_income_types_and_wallets.sql
-- * Income is split into three types: Salary, House Rent and Other Income.
--   Existing records get a type from their source name (contains "salary" ->
--   Salary, the word "rent" -> House Rent, anything else -> Other Income).
-- * Adds the GPay and Paytm payment methods and re-orders the list.
-- =====================================================================

ALTER TABLE income ADD COLUMN income_type TEXT NOT NULL DEFAULT 'Other Income'
  CHECK (income_type IN ('Salary', 'House Rent', 'Other Income'));

UPDATE income SET income_type = 'Salary' WHERE lower(source) LIKE '%salary%';
-- "rent" as a whole word only (not e.g. "Parents").
UPDATE income SET income_type = 'House Rent'
WHERE income_type <> 'Salary'
  AND (' ' || lower(trim(source)) || ' ') LIKE '% rent %';

CREATE INDEX idx_income_type ON income (income_type);

INSERT OR IGNORE INTO payment_methods (name, sort_order) VALUES ('GPay', 3), ('Paytm', 4);
UPDATE payment_methods SET sort_order = CASE name
  WHEN 'UPI'           THEN 1
  WHEN 'Phone Pay'     THEN 2
  WHEN 'GPay'          THEN 3
  WHEN 'Paytm'         THEN 4
  WHEN 'Bank Transfer' THEN 5
  WHEN 'Cash'          THEN 6
  WHEN 'Card'          THEN 7
  WHEN 'Other'         THEN 8
  ELSE sort_order END;
