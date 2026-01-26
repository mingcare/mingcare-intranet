#!/usr/bin/env python3
"""驗證導入結果"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 檢查 2026 年的記錄
result = supabase.table('financial_transactions').select('journal_number, transaction_date, transaction_item').eq('fiscal_year', 2026).order('journal_number').execute()
print(f'2026年記錄: {len(result.data)} 筆')
print()
for t in result.data[:20]:
    print(f"{t['journal_number']} | {t['transaction_date']} | {t['transaction_item'][:40]}")
print('...')

# 檢查序號表
seq = supabase.table('global_journal_sequence').select('*').execute()
print(f"\n序號表 last_number: {seq.data[0]['last_number']}")

# 檢查總數
total = supabase.table('financial_transactions').select('id', count='exact').execute()
print(f'總記錄數: {total.count}')

# 檢查按年份統計
for year in [2024, 2025, 2026]:
    count = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', year).execute()
    print(f'{year}年: {count.count} 筆')
