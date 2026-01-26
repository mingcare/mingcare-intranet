# 會計系統優化報告 - 第一步

## 🎯 優化目標
建立一套專業會計師樓級別的會計系統，包括：
- 自動生成交易編號
- 更好的零用金 (Petty Cash) 呈現
- 專業的流水帳功能

---

## ✅ 已完成優化

### 1. 數據庫架構升級 (`upgrade_accounting_system_v2.sql`)

#### 新增表格
| 表格 | 用途 |
|------|------|
| `accounting_categories` | 會計科目表 (Chart of Accounts) |
| `transaction_sequences` | 交易序號計數器 |
| `petty_cash_accounts` | 零用金帳戶追蹤 |

#### 自動化功能
- **自動序號生成函數** `generate_transaction_code()`
  - 格式：`MC-YYYY-MM-XXXX` (例如: MC-2025-01-0001)
  - 每月重新計數
  
- **觸發器**
  - `trigger_auto_generate_code`: 自動生成交易編號
  - `trigger_set_transaction_type`: 自動判斷交易類型

#### 新增視圖
- `monthly_financial_summary`: 月度財務摘要
- `expense_by_category`: 支出類別統計
- `income_by_category`: 收入類別統計
- `petty_cash_transactions`: 零用金交易記錄

---

### 2. 前端介面升級 (`/app/accounting/page.tsx`)

#### 新增功能
| 功能 | 說明 |
|------|------|
| 📋 交易列表 | 完整交易記錄，顯示編號、類別標籤 |
| 📊 財務摘要 | 月度統計、收支類別百分比條 |
| 💵 零用金專區 | 獨立頁面追蹤零用金補充/支出 |
| 📖 流水帳 | 專業會計流水帳格式，含累計餘額 |

#### UI 改進
- 4欄統計卡片設計 (收入/支出/淨額/零用金)
- 視圖切換標籤式導航
- 類型篩選 (全部/收入/支出/零用金)
- 搜尋功能增強
- 新增交易 Modal 完整表單

---

## 📊 會計科目表 (已預設)

### 收入科目 (4xxx)
| 編號 | 名稱 |
|------|------|
| 4001 | 護理服務費用 |
| 4101 | 股東資本 |
| 4102 | 銀行利息 |
| 4103 | 政府補貼 |

### 支出科目 (5xxx)
| 編號 | 名稱 |
|------|------|
| 5001 | 護理人員工資 |
| 5002 | 辦公室同事工資 |
| 5003 | MPF |
| 5101 | 租金 |
| 5102 | 電費 |
| 5103 | 水費 |
| 5104 | 電話費及上網費 |
| 5201 | 辦公用品 |
| 5202 | 辦公費用 |
| 5301 | 廣告及軟件費用 |
| 5401 | 交通開支 |
| 5402 | 商務餐 |
| ... | ... |

---

## 🚀 下一步優化建議

### 第二步：詳細報表功能
- [ ] 損益表 (Income Statement)
- [ ] 資產負債表 (Balance Sheet)
- [ ] 現金流量表 (Cash Flow Statement)
- [ ] 經手人報表

### 第三步：進階功能
- [ ] 應收/應付帳款管理
- [ ] 銀行對帳功能
- [ ] 審計追蹤 (Audit Trail)
- [ ] 多幣種支持
- [ ] 報表導出 (PDF/Excel)

---

## 📝 部署說明

### 1. 執行數據庫遷移
在 Supabase SQL Editor 中執行：
```sql
-- 檔案: supabase/migrations/upgrade_accounting_system_v2.sql
```

### 2. 部署前端更新
```bash
git add .
git commit -m "升級會計系統 v2.0 - 專業版"
git push
```

---

## 📁 檔案變更清單

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `supabase/migrations/upgrade_accounting_system_v2.sql` | 新增 | 數據庫升級腳本 |
| `app/accounting/page.tsx` | 修改 | 前端介面升級 |

---

*建立日期: 2025-01-XX*
*版本: v2.0 專業版*
