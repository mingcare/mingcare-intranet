-- ============================================
-- 明家居家護理服務 - 會計系統 v3.0
-- 重新設計：簡潔版本
-- ============================================

-- 1. 清空現有數據
TRUNCATE TABLE financial_transactions RESTART IDENTITY CASCADE;

-- 2. 刪除舊的觸發器和函數
DROP TRIGGER IF EXISTS auto_generate_transaction_code ON financial_transactions;
DROP TRIGGER IF EXISTS auto_generate_journal_number ON financial_transactions;
DROP TRIGGER IF EXISTS set_transaction_type ON financial_transactions;
DROP FUNCTION IF EXISTS generate_transaction_code();
DROP FUNCTION IF EXISTS generate_journal_number();
DROP FUNCTION IF EXISTS auto_set_transaction_type();

-- 3. 刪除舊的輔助表
DROP TABLE IF EXISTS global_journal_sequence CASCADE;
DROP TABLE IF EXISTS transaction_sequences CASCADE;
DROP TABLE IF EXISTS accounting_categories CASCADE;
DROP TABLE IF EXISTS petty_cash_accounts CASCADE;

-- 4. 刪除舊的視圖
DROP VIEW IF EXISTS monthly_financial_summary;
DROP VIEW IF EXISTS expense_by_category;
DROP VIEW IF EXISTS income_by_category;
DROP VIEW IF EXISTS petty_cash_transactions;

-- 5. 重新設計 financial_transactions 表
-- 先刪除再重建
DROP TABLE IF EXISTS financial_transactions CASCADE;

CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 編號系統
  journal_number VARCHAR(20),           -- 流水號: 00000001, 00000002...
  transaction_code VARCHAR(30),         -- 原始編號: 2024-05-001
  
  -- 時間資訊
  fiscal_year INTEGER NOT NULL,         -- 所屬年份: 2024, 2025
  billing_month VARCHAR(20) NOT NULL,   -- 帳單月份: 2024年5月
  transaction_date DATE NOT NULL,       -- 交易日期
  
  -- 交易內容
  transaction_item TEXT NOT NULL,       -- 交易項目描述
  payment_method VARCHAR(50),           -- 付款方式: 現金, 銀行轉賬, Payme...
  
  -- 收入
  income_category VARCHAR(100),         -- 收入類別: 服務收入, 股東資本...
  income_amount DECIMAL(12,2) DEFAULT 0,
  
  -- 支出
  expense_category VARCHAR(100),        -- 支出類別: 租金, 辦公用品...
  expense_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Petty Cash 標注 (只是資訊，不影響收支判斷)
  petty_cash DECIMAL(12,2) DEFAULT 0,   -- 放入零用金的金額
  
  -- 其他資訊
  handler VARCHAR(100),                 -- 經手人
  reimbursement_status VARCHAR(50),     -- 報銷狀態
  notes TEXT,                           -- 備註
  
  -- 系統欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 創建索引
CREATE INDEX idx_ft_fiscal_year ON financial_transactions(fiscal_year);
CREATE INDEX idx_ft_billing_month ON financial_transactions(billing_month);
CREATE INDEX idx_ft_transaction_date ON financial_transactions(transaction_date);
CREATE INDEX idx_ft_income_category ON financial_transactions(income_category);
CREATE INDEX idx_ft_expense_category ON financial_transactions(expense_category);
CREATE INDEX idx_ft_journal_number ON financial_transactions(journal_number);

-- 7. 創建流水號序列表
CREATE TABLE global_journal_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_number INTEGER DEFAULT 0,
  CHECK (id = 1)  -- 確保只有一行
);
INSERT INTO global_journal_sequence (id, last_number) VALUES (1, 0);

-- 8. 創建生成流水號的函數
CREATE OR REPLACE FUNCTION generate_journal_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number INTEGER;
BEGIN
  -- 獲取並更新序號
  UPDATE global_journal_sequence 
  SET last_number = last_number + 1 
  WHERE id = 1
  RETURNING last_number INTO new_number;
  
  -- 格式化為8位數字
  NEW.journal_number := LPAD(new_number::TEXT, 8, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 創建觸發器
CREATE TRIGGER auto_generate_journal_number
  BEFORE INSERT ON financial_transactions
  FOR EACH ROW
  WHEN (NEW.journal_number IS NULL)
  EXECUTE FUNCTION generate_journal_number();

-- 10. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 11. 啟用 RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON financial_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- 12. 創建有用的視圖

-- 月度摘要視圖
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  fiscal_year,
  billing_month,
  COUNT(*) as transaction_count,
  SUM(income_amount) as total_income,
  SUM(expense_amount) as total_expense,
  SUM(income_amount) - SUM(expense_amount) as net_amount
FROM financial_transactions
GROUP BY fiscal_year, billing_month
ORDER BY fiscal_year DESC, billing_month DESC;

-- 收入類別摘要
CREATE OR REPLACE VIEW income_by_category AS
SELECT 
  fiscal_year,
  income_category,
  COUNT(*) as transaction_count,
  SUM(income_amount) as total_amount
FROM financial_transactions
WHERE income_amount > 0
GROUP BY fiscal_year, income_category
ORDER BY fiscal_year DESC, total_amount DESC;

-- 支出類別摘要
CREATE OR REPLACE VIEW expense_by_category AS
SELECT 
  fiscal_year,
  expense_category,
  COUNT(*) as transaction_count,
  SUM(expense_amount) as total_amount
FROM financial_transactions
WHERE expense_amount > 0
GROUP BY fiscal_year, expense_category
ORDER BY fiscal_year DESC, total_amount DESC;

-- 完成
SELECT '會計系統 v3.0 重建完成!' as status;
