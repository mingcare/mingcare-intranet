from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'

supabase = create_client(url, key)

print("=== 2026年1月6日的交易記錄 ===\n")
result = supabase.table('financial_transactions').select('*').eq('transaction_date', '2026-01-06').order('journal_number').execute()

print(f"共 {len(result.data)} 筆\n")
for r in result.data:
    print(f"序號: {r['journal_number']}")
    print(f"  項目: {r['transaction_item']}")
    print(f"  付款方式: {r['payment_method']}")
    print(f"  收入: ${r['income_amount']} | 支出: ${r['expense_amount']}")
    print(f"  收入類別: {r['income_category']} | 支出類別: {r['expense_category']}")
    print(f"  零用金扣除: {r['deduct_from_petty_cash']}")
    print()
