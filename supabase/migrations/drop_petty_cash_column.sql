-- 刪除 petty_cash 欄位
ALTER TABLE financial_transactions DROP COLUMN IF EXISTS petty_cash;

SELECT '已刪除 petty_cash 欄位' as status;
