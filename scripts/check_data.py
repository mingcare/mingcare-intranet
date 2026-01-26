from supabase import create_client

# 數據項目 (Data Project)
url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'

supabase = create_client(url, key)

# 檢查所有表的記錄數
print("=== 數據項目 - 表記錄統計 ===")
tables = [
    'auth_user_bridge',
    'billing_salary_data', 
    'care_staff_profiles',
    'clock_records',
    'commission_rate_introducer',
    'customer_personal_data',
    'service_signatures',
    'signature_files',
    'voucher_rate',
    'job_position_options',
    'language_options',
    'notifications',
    'financial_transactions',
    'global_journal_sequence',
    'accounting_handlers',
    'income_categories',
    'expense_categories',
    'payment_methods',
    'reimbursement_statuses'
]

for table in tables:
    try:
        result = supabase.table(table).select('*', count='exact').limit(1).execute()
        print(f"{table}: {result.count} 筆")
    except Exception as e:
        print(f"{table}: 表不存在或錯誤 - {str(e)[:50]}")

# 檢查 financial_transactions 各年數據
print("\n=== financial_transactions 各年統計 ===")
for year in [2024, 2025, 2026]:
    try:
        result = supabase.table('financial_transactions').select('*', count='exact').eq('fiscal_year', year).execute()
        print(f"{year}年: {result.count} 筆")
    except Exception as e:
        print(f"{year}年: 錯誤 - {str(e)[:50]}")

# 檢查付款方式分佈
print("\n=== 2026年付款方式分佈 ===")
try:
    result = supabase.table('financial_transactions').select('payment_method').eq('fiscal_year', 2026).execute()
    methods = {}
    for r in result.data:
        m = r['payment_method'] or 'NULL'
        methods[m] = methods.get(m, 0) + 1
    for m, c in sorted(methods.items(), key=lambda x: -x[1]):
        print(f"  {m}: {c}")
except Exception as e:
    print(f"錯誤: {e}")
