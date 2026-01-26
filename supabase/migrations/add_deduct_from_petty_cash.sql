-- 新增 deduct_from_petty_cash 欄位
-- 用於標記現金支出是否從零用金扣除

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS deduct_from_petty_cash BOOLEAN DEFAULT true;

-- 更新現有記錄：所有現金交易預設為從零用金扣除
UPDATE financial_transactions 
SET deduct_from_petty_cash = true 
WHERE payment_method = '現金';

-- 銀行轉賬不需要這個欄位，設為 NULL
UPDATE financial_transactions 
SET deduct_from_petty_cash = NULL 
WHERE payment_method != '現金';

SELECT '已新增 deduct_from_petty_cash 欄位' as status;
