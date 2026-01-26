#!/usr/bin/env python3
"""驗證所有交易數據"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得總數
total = supabase.table('financial_transactions').select('id', count='exact').execute()
print(f'總交易數: {total.count}')

# 分頁取得所有數據
all_data = []
offset = 0
while True:
    result = supabase.table('financial_transactions').select('payment_method, deleted_at').range(offset, offset + 999).execute()
    all_data.extend(result.data)
    if len(result.data) < 1000:
        break
    offset += 1000

print(f'實際取得: {len(all_data)} 筆')

# 過濾掉已刪除的
active = [r for r in all_data if not r.get('deleted_at')]
deleted = [r for r in all_data if r.get('deleted_at')]
print(f'有效記錄: {len(active)} 筆')
print(f'已刪除: {len(deleted)} 筆')

# 按付款方式統計
payment_counts = {}
for r in active:
    pm = r.get('payment_method') or '(null)'
    payment_counts[pm] = payment_counts.get(pm, 0) + 1

print('\n按付款方式統計 (有效記錄):')
for pm, count in sorted(payment_counts.items(), key=lambda x: -x[1]):
    print(f'  {pm}: {count} 筆')
