-- ============================================
-- 明家居家護理服務 - 會計類別設定
-- 建立經手人、收入類別、支出類別的枚舉表
-- ============================================

-- 1. 經手人表
CREATE TABLE IF NOT EXISTS accounting_handlers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 收入類別表
CREATE TABLE IF NOT EXISTS income_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#22c55e',  -- 顏色標識
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 支出類別表
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#ef4444',  -- 顏色標識
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 付款方式表
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 報銷狀態表
CREATE TABLE IF NOT EXISTS reimbursement_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 插入預設數據
-- ============================================

-- 經手人（從現有數據提取 + 常用）
INSERT INTO accounting_handlers (name, sort_order) VALUES
  ('Joe', 1),
  ('Steven', 2),
  ('Candy', 3),
  ('Admin', 4)
ON CONFLICT (name) DO NOTHING;

-- 收入類別
INSERT INTO income_categories (name, color, sort_order) VALUES
  ('護理服務費用', '#22c55e', 1),
  ('股東資本', '#3b82f6', 2),
  ('銀行利息', '#8b5cf6', 3),
  ('政府補貼', '#f59e0b', 4)
ON CONFLICT (name) DO NOTHING;

-- 支出類別
INSERT INTO expense_categories (name, color, sort_order) VALUES
  ('辦公室同事工資', '#ef4444', 1),
  ('護理人員工資', '#f97316', 2),
  ('交通開支', '#eab308', 3),
  ('設備', '#84cc16', 4),
  ('廣告及軟件費用', '#22c55e', 5),
  ('辦公用品', '#14b8a6', 6),
  ('辦公費用', '#06b6d4', 7),
  ('牌照費', '#0ea5e9', 8),
  ('租金', '#3b82f6', 9),
  ('維修費用', '#6366f1', 10),
  ('電話費及上網費', '#8b5cf6', 11),
  ('水費', '#a855f7', 12),
  ('電費', '#d946ef', 13),
  ('商務餐', '#ec4899', 14),
  ('保險', '#f43f5e', 15),
  ('客人退款', '#fb7185', 16),
  ('MPF', '#64748b', 17),
  ('銀行手續費', '#78716c', 18),
  ('Steven 會籍費用', '#a3a3a3', 19),
  ('佣金', '#737373', 20),
  ('股東支出', '#525252', 21),
  ('Petty Cash', '#fbbf24', 22)
ON CONFLICT (name) DO NOTHING;

-- 付款方式
INSERT INTO payment_methods (name, sort_order) VALUES
  ('現金', 1),
  ('銀行轉賬', 2),
  ('Payme', 3),
  ('支票', 4),
  ('FPS', 5)
ON CONFLICT (name) DO NOTHING;

-- 報銷狀態
INSERT INTO reimbursement_statuses (name, color, sort_order) VALUES
  ('已完成', '#22c55e', 1),
  ('未完成', '#ef4444', 2),
  ('處理中', '#f59e0b', 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 啟用 RLS
-- ============================================
ALTER TABLE accounting_handlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON accounting_handlers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON income_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON reimbursement_statuses FOR ALL USING (true) WITH CHECK (true);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_handlers_active ON accounting_handlers(is_active);
CREATE INDEX IF NOT EXISTS idx_income_cat_active ON income_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_cat_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_reimburse_active ON reimbursement_statuses(is_active);

SELECT '會計類別設定完成!' as status;
