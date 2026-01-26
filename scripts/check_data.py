from supabase import create_client

# 數據項目 (Data Project)
url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'

supabase = create_client(url, key)

# 查找 payment_method 為 NULL 的記錄
print("=== payment_method 為 NULL 的記錄 ===")
result = supabase.table('financial_transactions').select('*').is_('payment_method', 'null').execute()

print(f"共 {len(result.data)} 筆\n")
for r in result.data:
    print(f"序號: {r['journal_number']} | 年份: {r['fiscal_year']} | 日期: {r['transaction_date']}")
    print(f"  項目: {r['transaction_item']}")
    print(f"  收入: {r['income_amount']} | 支出: {r['expense_amount']}")
    print(f"  付款方式: {r['payment_method']} | 收入類別: {r['income_category']} | 支出類別: {r['expense_category']}")
    print()

# 查找可能有問題的記錄（現金但沒有設置 deduct_from_petty_cash）
print("\n=== 現金交易但 deduct_from_petty_cash 為 NULL 的記錄 ===")
result = supabase.table('financial_transactions').select('journal_number, fiscal_year, transaction_item, income_amount, expense_amount, deduct_from_petty_cash').eq('payment_method', '現金').is_('deduct_from_petty_cash', 'null').execute()
print(f"共 {len(result.data)} 筆")

# 統計各年 deduct_from_petty_cash 的分佈
print("\n=== 各年 deduct_from_petty_cash 分佈 ===")
for year in [2024, 2025, 2026]:
    result = supabase.table('financial_transactions').select('deduct_from_petty_cash', count='exact').eq('fiscal_year', year).execute()
    
    stats = {'True': 0, 'False': 0, 'NULL': 0}
    for r in result.data:
        dfpc = r['deduct_from_petty_cash']
        if dfpc is True:
            stats['True'] += 1
        elif dfpc is False:
            stats['False'] += 1
        else:
            stats['NULL'] += 1
    
    print(f"{year}年: True={stats['True']}, False={stats['False']}, NULL={stats['NULL']}")
