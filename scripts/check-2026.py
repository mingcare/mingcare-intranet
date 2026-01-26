#!/usr/bin/env python3
"""檢查 2026 年的交易記錄"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得 2026 年的所有交易
result = supabase.table('financial_transactions').select('*').eq('fiscal_year', 2026).order('transaction_date').execute()

print(f'=== 2026年交易記錄 ({len(result.data)} 筆) ===\n')
print(f'{"流水號":<12} {"日期":<12} {"付款方式":<10} {"收入":<12} {"支出":<12} {"交易項目"}')
print('-' * 100)

for t in result.data:
    jn = t.get('journal_number', '')
    date = t.get('transaction_date', '')
    pm = t.get('payment_method', '') or ''
    income = t.get('income_amount', 0) or 0
    expense = t.get('expense_amount', 0) or 0
    item = (t.get('transaction_item', '') or '')[:40]
    print(f'{jn:<12} {date:<12} {pm:<10} {income:<12.2f} {expense:<12.2f} {item}')

# 檢查截圖中顯示的流水號
screenshot_numbers = ['00001718', '00001717', '00001723', '00001721', '00001719', '00001722', 
                      '00001727', '00001728', '00001739', '00001740', '00001744', '00001785',
                      '00001745', '00001796', '00001811', '00001812', '00001813', '00001814',
                      '00001815', '00001819', '00001825', '00001824', '00001826']

db_numbers = [t.get('journal_number') for t in result.data]

print(f'\n=== 對比截圖 ===')
print(f'截圖顯示: {len(screenshot_numbers)} 筆')
print(f'數據庫有: {len(db_numbers)} 筆')

# 找出截圖有但數據庫沒有的
missing_in_db = [n for n in screenshot_numbers if n not in db_numbers]
if missing_in_db:
    print(f'\n截圖有但數據庫沒有: {missing_in_db}')

# 找出數據庫有但截圖沒有的
extra_in_db = [n for n in db_numbers if n not in screenshot_numbers]
if extra_in_db:
    print(f'\n數據庫有但截圖沒有: {extra_in_db}')
