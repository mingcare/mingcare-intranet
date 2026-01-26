#!/usr/bin/env python3
"""測試前端的查詢邏輯"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 測試前端的查詢 (2025年)
print('=== 測試 2025 年查詢 ===')

# 不分頁，直接計數
count_result = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', 2025).execute()
print(f'2025年總數 (count): {count_result.count}')

# 加上 is_deleted 過濾
count_result2 = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', 2025).or_('is_deleted.is.null,is_deleted.eq.false').execute()
print(f'2025年未刪除 (count): {count_result2.count}')

# 分頁取得
all_data = []
offset = 0
pageSize = 1000
while True:
    result = supabase.table('financial_transactions').select('*').eq('fiscal_year', 2025).or_('is_deleted.is.null,is_deleted.eq.false').order('transaction_date').range(offset, offset + pageSize - 1).execute()
    all_data.extend(result.data)
    print(f'  offset {offset}: 取得 {len(result.data)} 筆')
    if len(result.data) < pageSize:
        break
    offset += pageSize

print(f'2025年實際取得: {len(all_data)} 筆')

# 檢查流水帳和零用金
ledger = [t for t in all_data if 
    t.get('payment_method') == '銀行轉賬' or
    (t.get('payment_method') == '現金' and (t.get('expense_amount') or 0) > 0 and t.get('deduct_from_petty_cash') == False)
]
petty = [t for t in all_data if 
    t.get('payment_method') == '現金' and 
    t.get('deduct_from_petty_cash') != False
]
print(f'\n流水帳: {len(ledger)} 筆')
print(f'零用金: {len(petty)} 筆')
print(f'總顯示: {len(ledger) + len(petty)} 筆 (可能有重複)')
