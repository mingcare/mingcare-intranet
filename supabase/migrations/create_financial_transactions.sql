-- 創建財務交易表
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code TEXT UNIQUE, -- 序號 (例如: 2024-05-001)
  billing_month TEXT, -- 帳單所屬月份 (例如: 2024年5月)
  transaction_date DATE NOT NULL, -- 交易日期
  transaction_item TEXT NOT NULL, -- 交易項目描述
  payment_method TEXT, -- 付款方式 (現金/銀行轉賬)
  income_category TEXT, -- 收入項目
  expense_category TEXT, -- 支出項目
  income_amount DECIMAL(12,2) DEFAULT 0, -- 收入金額
  expense_amount DECIMAL(12,2) DEFAULT 0, -- 支出金額
  petty_cash DECIMAL(12,2), -- Petty Cash
  handler TEXT, -- 經手人
  reimbursement_status TEXT, -- 申請報銷狀態
  fiscal_year INTEGER, -- 所屬年份
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引以提高查詢效率
CREATE INDEX IF NOT EXISTS idx_transaction_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_billing_month ON financial_transactions(billing_month);
CREATE INDEX IF NOT EXISTS idx_fiscal_year ON financial_transactions(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_transaction_code ON financial_transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_income_category ON financial_transactions(income_category) WHERE income_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_category ON financial_transactions(expense_category) WHERE expense_category IS NOT NULL;

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transactions_updated_at();

-- 添加註釋
COMMENT ON TABLE financial_transactions IS '財務交易記錄表';
COMMENT ON COLUMN financial_transactions.transaction_code IS '交易序號，例如: 2024-05-001';
COMMENT ON COLUMN financial_transactions.billing_month IS '帳單所屬月份，例如: 2024年5月';
COMMENT ON COLUMN financial_transactions.transaction_date IS '交易日期';
COMMENT ON COLUMN financial_transactions.transaction_item IS '交易項目描述';
COMMENT ON COLUMN financial_transactions.payment_method IS '付款方式: 現金或銀行轉賬';
COMMENT ON COLUMN financial_transactions.income_category IS '收入類別';
COMMENT ON COLUMN financial_transactions.expense_category IS '支出類別';
COMMENT ON COLUMN financial_transactions.income_amount IS '收入金額';
COMMENT ON COLUMN financial_transactions.expense_amount IS '支出金額';
COMMENT ON COLUMN financial_transactions.petty_cash IS '零用金';
COMMENT ON COLUMN financial_transactions.handler IS '經手人';
COMMENT ON COLUMN financial_transactions.reimbursement_status IS '報銷狀態';
COMMENT ON COLUMN financial_transactions.fiscal_year IS '財政年份';

-- 啟用 Row Level Security (RLS)
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 政策: 允許認證用戶讀取
CREATE POLICY "Allow authenticated users to read financial_transactions"
  ON financial_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- 創建 RLS 政策: 允許認證用戶插入
CREATE POLICY "Allow authenticated users to insert financial_transactions"
  ON financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 創建 RLS 政策: 允許認證用戶更新
CREATE POLICY "Allow authenticated users to update financial_transactions"
  ON financial_transactions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 創建 RLS 政策: 允許認證用戶刪除
CREATE POLICY "Allow authenticated users to delete financial_transactions"
  ON financial_transactions
  FOR DELETE
  TO authenticated
  USING (true);
