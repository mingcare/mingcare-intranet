-- ============================================
-- 明家居家護理服務 - 審計日誌系統
-- 記錄所有財務交易的修改和刪除操作
-- ============================================

-- 1. 在 financial_transactions 添加審計欄位
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 創建審計日誌表
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯的交易
  transaction_id UUID NOT NULL,
  journal_number VARCHAR(20),           -- 保存流水號方便查詢
  
  -- 操作類型
  action_type VARCHAR(20) NOT NULL,     -- 'create', 'update', 'delete', 'restore'
  
  -- 變更內容
  changed_fields TEXT[],                -- 變更的欄位名稱列表
  old_values JSONB,                     -- 變更前的值
  new_values JSONB,                     -- 變更後的值
  
  -- 操作者資訊
  performed_by VARCHAR(100) NOT NULL,   -- 操作者名稱/Email
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 備註
  notes TEXT
);

-- 3. 創建索引
CREATE INDEX IF NOT EXISTS idx_audit_transaction_id ON financial_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON financial_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON financial_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_performed_at ON financial_audit_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_ft_is_deleted ON financial_transactions(is_deleted);

-- 4. 啟用 RLS
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON financial_audit_log
  FOR ALL USING (true) WITH CHECK (true);

-- 5. 創建審計日誌視圖（方便查詢）
CREATE OR REPLACE VIEW recent_audit_log AS
SELECT 
  a.id,
  a.transaction_id,
  a.journal_number,
  a.action_type,
  a.changed_fields,
  a.old_values,
  a.new_values,
  a.performed_by,
  a.performed_at,
  a.notes,
  CASE a.action_type
    WHEN 'create' THEN '新增'
    WHEN 'update' THEN '修改'
    WHEN 'delete' THEN '刪除'
    WHEN 'restore' THEN '還原'
    ELSE a.action_type
  END as action_type_display
FROM financial_audit_log a
ORDER BY a.performed_at DESC;

-- 完成
SELECT '審計日誌系統創建完成!' as status;
