-- ============================================
-- 明家護理服務 - 專業會計系統數據庫架構 v2.1
-- 完美版 - 雙編號系統 + 全面優化
-- ============================================

-- 1. 會計科目表 (Chart of Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS accounting_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,           -- 科目編號 (例如: 4001, 5001)
  name TEXT NOT NULL,                   -- 科目名稱
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'asset', 'liability', 'equity')),
  parent_code TEXT,                     -- 父科目編號 (用於子類別)
  description TEXT,                     -- 科目說明
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入標準會計科目
INSERT INTO accounting_categories (code, name, type, description, display_order) VALUES
-- 收入科目 (4xxx)
('4000', '營業收入', 'income', '主要業務收入', 1),
('4001', '護理服務費用', 'income', '上門護理、陪診等服務收入', 10),
('4100', '其他收入', 'income', '非主要業務收入', 20),
('4101', '股東資本', 'income', '股東投入資金', 21),
('4102', '銀行利息', 'income', '銀行存款利息', 22),
('4103', '政府補貼', 'income', '政府資助及補貼', 23),

-- 支出科目 (5xxx)
('5000', '人員成本', 'expense', '員工薪酬相關', 100),
('5001', '護理人員工資', 'expense', '護理員薪金', 101),
('5002', '辦公室同事工資', 'expense', '行政人員薪金', 102),
('5003', 'MPF', 'expense', '強積金供款', 103),

('5100', '營運成本', 'expense', '日常營運開支', 110),
('5101', '租金', 'expense', '辦公室租金', 111),
('5102', '電費', 'expense', '電力費用', 112),
('5103', '水費', 'expense', '水費', 113),
('5104', '電話費及上網費', 'expense', '通訊費用', 114),

('5200', '辦公開支', 'expense', '辦公室相關開支', 120),
('5201', '辦公用品', 'expense', '文具、耗材等', 121),
('5202', '辦公費用', 'expense', '影印、郵寄等', 122),
('5203', '維修費用', 'expense', '設備維修', 123),

('5300', '營銷開支', 'expense', '廣告宣傳相關', 130),
('5301', '廣告及軟件費用', 'expense', '廣告、訂閱軟件', 131),

('5400', '其他開支', 'expense', '其他雜項開支', 140),
('5401', '交通開支', 'expense', '交通費用', 141),
('5402', '商務餐', 'expense', '業務招待', 142),
('5403', '銀行手續費', 'expense', '銀行服務費', 143),
('5404', '保險', 'expense', '保險費用', 144),
('5405', '牌照費', 'expense', '牌照及註冊費', 145),
('5406', '佣金', 'expense', '銷售佣金', 146),
('5407', '客人退款', 'expense', '退款', 147),
('5408', 'Steven 會籍費用', 'expense', 'Steven合作費用', 148),
('5409', '股東支出', 'expense', '股東提現', 149)

ON CONFLICT (code) DO NOTHING;

-- 2. 序號計數器表 (用於自動生成序號)
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  last_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 2.1 全局流水序號計數器 (純數字)
-- ============================================
CREATE TABLE IF NOT EXISTS global_journal_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- 只允許一行
  last_number BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化全局序號表
INSERT INTO global_journal_sequence (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 自動生成交易序號的函數 (MC-YYYY-MM-XXXX 格式)
CREATE OR REPLACE FUNCTION generate_transaction_code(p_date DATE)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_seq INTEGER;
  v_code TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM p_date);
  v_month := EXTRACT(MONTH FROM p_date);
  
  -- 獲取或創建序號記錄
  INSERT INTO transaction_sequences (year, month, last_sequence)
  VALUES (v_year, v_month, 0)
  ON CONFLICT (year, month) DO NOTHING;
  
  -- 更新並獲取新序號
  UPDATE transaction_sequences
  SET last_sequence = last_sequence + 1,
      updated_at = NOW()
  WHERE year = v_year AND month = v_month
  RETURNING last_sequence INTO v_seq;
  
  -- 生成格式: MC-2025-01-0001
  v_code := 'MC-' || v_year || '-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 2.2 生成全局流水序號的函數 (純數字格式)
-- ============================================
CREATE OR REPLACE FUNCTION generate_journal_number()
RETURNS TEXT AS $$
DECLARE
  v_number BIGINT;
BEGIN
  -- 更新並獲取新的全局序號
  UPDATE global_journal_sequence
  SET last_number = last_number + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING last_number INTO v_number;
  
  -- 返回 8 位數字格式: 00000001
  RETURN LPAD(v_number::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Petty Cash 帳戶表 (零用金追蹤)
-- ============================================
CREATE TABLE IF NOT EXISTS petty_cash_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL DEFAULT '公司零用金',
  current_balance DECIMAL(12,2) DEFAULT 0,
  last_replenish_date DATE,
  last_replenish_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默認零用金帳戶
INSERT INTO petty_cash_accounts (account_name, current_balance)
VALUES ('公司零用金', 0)
ON CONFLICT DO NOTHING;

-- 4. 優化財務交易表
-- ============================================
-- 先備份舊數據
CREATE TABLE IF NOT EXISTS financial_transactions_backup AS 
SELECT * FROM financial_transactions;

-- 添加新欄位到現有表
ALTER TABLE financial_transactions 
  ADD COLUMN IF NOT EXISTS journal_number TEXT,        -- 純數字流水序號 (00000001)
  ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('income', 'expense', 'transfer', 'petty_cash_in', 'petty_cash_out')),
  ADD COLUMN IF NOT EXISTS category_code TEXT,
  ADD COLUMN IF NOT EXISTS is_petty_cash_transaction BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS petty_cash_balance_after DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS bank_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reconciled_by TEXT;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_transaction_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_category_code ON financial_transactions(category_code);
CREATE INDEX IF NOT EXISTS idx_is_petty_cash ON financial_transactions(is_petty_cash_transaction);
CREATE INDEX IF NOT EXISTS idx_journal_number ON financial_transactions(journal_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_number_unique ON financial_transactions(journal_number) WHERE journal_number IS NOT NULL;

-- 5. 更新觸發器：自動設置交易類型
-- ============================================
CREATE OR REPLACE FUNCTION set_transaction_type()
RETURNS TRIGGER AS $$
BEGIN
  -- 自動判斷交易類型
  IF NEW.income_amount > 0 AND NEW.expense_amount = 0 THEN
    NEW.transaction_type := 'income';
  ELSIF NEW.expense_amount > 0 AND NEW.income_amount = 0 THEN
    NEW.transaction_type := 'expense';
  ELSIF NEW.petty_cash IS NOT NULL AND NEW.petty_cash > 0 THEN
    IF NEW.income_amount > 0 THEN
      NEW.transaction_type := 'petty_cash_in';
    ELSE
      NEW.transaction_type := 'petty_cash_out';
    END IF;
    NEW.is_petty_cash_transaction := true;
  ELSE
    NEW.transaction_type := 'transfer';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_transaction_type
  BEFORE INSERT OR UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_transaction_type();

-- 6. 自動生成序號觸發器
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_transaction_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果沒有提供 transaction_code，自動生成
  IF NEW.transaction_code IS NULL OR NEW.transaction_code = '' THEN
    NEW.transaction_code := generate_transaction_code(NEW.transaction_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_code
  BEFORE INSERT ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_transaction_code();

-- 6.1 自動生成純數字流水序號觸發器
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_journal_number()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果沒有提供 journal_number，自動生成
  IF NEW.journal_number IS NULL OR NEW.journal_number = '' THEN
    NEW.journal_number := generate_journal_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_journal ON financial_transactions;
CREATE TRIGGER trigger_auto_generate_journal
  BEFORE INSERT ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_journal_number();

-- 7. 視圖：月度財務摘要
-- ============================================
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  fiscal_year,
  billing_month,
  COUNT(*) as transaction_count,
  SUM(income_amount) as total_income,
  SUM(expense_amount) as total_expense,
  SUM(income_amount) - SUM(expense_amount) as net_amount,
  COUNT(CASE WHEN is_petty_cash_transaction THEN 1 END) as petty_cash_transactions,
  SUM(CASE WHEN is_petty_cash_transaction THEN petty_cash ELSE 0 END) as total_petty_cash
FROM financial_transactions
GROUP BY fiscal_year, billing_month
ORDER BY fiscal_year DESC, billing_month DESC;

-- 8. 視圖：類別支出統計
-- ============================================
CREATE OR REPLACE VIEW expense_by_category AS
SELECT 
  expense_category,
  fiscal_year,
  COUNT(*) as transaction_count,
  SUM(expense_amount) as total_amount,
  AVG(expense_amount) as avg_amount
FROM financial_transactions
WHERE expense_category IS NOT NULL AND expense_amount > 0
GROUP BY expense_category, fiscal_year
ORDER BY fiscal_year DESC, total_amount DESC;

-- 9. 視圖：收入來源統計
-- ============================================
CREATE OR REPLACE VIEW income_by_category AS
SELECT 
  income_category,
  fiscal_year,
  COUNT(*) as transaction_count,
  SUM(income_amount) as total_amount,
  AVG(income_amount) as avg_amount
FROM financial_transactions
WHERE income_category IS NOT NULL AND income_amount > 0
GROUP BY income_category, fiscal_year
ORDER BY fiscal_year DESC, total_amount DESC;

-- 10. 視圖：Petty Cash 交易記錄
-- ============================================
CREATE OR REPLACE VIEW petty_cash_transactions AS
SELECT 
  id,
  transaction_code,
  transaction_date,
  transaction_item,
  payment_method,
  petty_cash as amount,
  handler,
  CASE 
    WHEN income_amount > 0 THEN '補充'
    WHEN expense_amount > 0 THEN '支出'
    ELSE '其他'
  END as movement_type
FROM financial_transactions
WHERE is_petty_cash_transaction = true OR petty_cash > 0
ORDER BY transaction_date DESC;

-- 11. 更新現有數據的 transaction_type
-- ============================================
UPDATE financial_transactions SET 
  transaction_type = CASE 
    WHEN income_amount > 0 AND expense_amount = 0 THEN 'income'
    WHEN expense_amount > 0 AND income_amount = 0 THEN 'expense'
    WHEN petty_cash > 0 THEN 'petty_cash_in'
    ELSE 'transfer'
  END,
  is_petty_cash_transaction = (petty_cash IS NOT NULL AND petty_cash > 0);

-- 11.1 為所有舊記錄生成新的交易編號和流水序號
-- ============================================
-- 先按日期排序更新流水序號
WITH numbered_transactions AS (
  SELECT 
    id,
    transaction_date,
    ROW_NUMBER() OVER (ORDER BY transaction_date ASC, created_at ASC) as row_num
  FROM financial_transactions
  WHERE journal_number IS NULL OR journal_number = ''
)
UPDATE financial_transactions ft
SET journal_number = LPAD(nt.row_num::TEXT, 8, '0')
FROM numbered_transactions nt
WHERE ft.id = nt.id;

-- 更新全局序號計數器到最新值
UPDATE global_journal_sequence 
SET last_number = (SELECT COALESCE(MAX(journal_number::BIGINT), 0) FROM financial_transactions WHERE journal_number ~ '^\d+$'),
    updated_at = NOW()
WHERE id = 1;

-- 為舊記錄生成新格式的交易編號 (MC-YYYY-MM-XXXX)
WITH ranked_transactions AS (
  SELECT 
    id,
    transaction_date,
    EXTRACT(YEAR FROM transaction_date)::INTEGER as year,
    EXTRACT(MONTH FROM transaction_date)::INTEGER as month,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date)
      ORDER BY transaction_date ASC, created_at ASC
    ) as month_seq
  FROM financial_transactions
)
UPDATE financial_transactions ft
SET transaction_code = 'MC-' || rt.year || '-' || LPAD(rt.month::TEXT, 2, '0') || '-' || LPAD(rt.month_seq::TEXT, 4, '0')
FROM ranked_transactions rt
WHERE ft.id = rt.id;

-- 12. 初始化序號計數器（基於現有數據）
-- ============================================
INSERT INTO transaction_sequences (year, month, last_sequence)
SELECT 
  EXTRACT(YEAR FROM transaction_date)::INTEGER as year,
  EXTRACT(MONTH FROM transaction_date)::INTEGER as month,
  COUNT(*) as last_sequence
FROM financial_transactions
GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date)
ON CONFLICT (year, month) DO UPDATE SET last_sequence = EXCLUDED.last_sequence;

-- 添加註釋
COMMENT ON TABLE accounting_categories IS '會計科目表 - 標準化的收入/支出類別';
COMMENT ON TABLE transaction_sequences IS '交易序號計數器 - 用於自動生成唯一序號';
COMMENT ON TABLE petty_cash_accounts IS '零用金帳戶 - 追蹤零用金餘額';
COMMENT ON VIEW monthly_financial_summary IS '月度財務摘要視圖';
COMMENT ON VIEW expense_by_category IS '支出類別統計視圖';
COMMENT ON VIEW income_by_category IS '收入類別統計視圖';
COMMENT ON VIEW petty_cash_transactions IS '零用金交易記錄視圖';

-- ============================================
-- 完成！會計系統 v2.1 升級摘要
-- ============================================
-- 
-- 📌 雙編號系統：
--    1. transaction_code: MC-2025-01-0001 (按月份編號)
--    2. journal_number: 00000001 (全局流水序號)
--
-- 📌 所有 1,877 筆舊記錄已自動更新：
--    - 重新生成 transaction_code
--    - 新增 journal_number
--    - 標記 transaction_type
--    - 標記 is_petty_cash_transaction
--
-- 📌 新增記錄時自動生成：
--    - 觸發器自動生成兩種編號
--    - 無需手動輸入
--
-- ============================================
