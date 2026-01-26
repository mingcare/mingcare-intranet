#!/usr/bin/env python3
"""檢查所有付款方式"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得所有不同的 payment_method
all_data = []
offset = 0
while True:
    result = supabase.table('financial_transactions').select('payment_method, transaction_item, income_amount, expense_amount').range(offset, offset + 999).execute()
    all_data.extend(result.data)
    if len(result.data) < 1000:
        break
    offset += 1000

payment_counts = {}
for r in all_data:
    pm = r.get('payment_method') or '(null/空白)'
    payment_counts[pm] = payment_counts.get(pm, 0) + 1

print('=== 所有付款方式統計 ===')
for pm, count in sorted(payment_counts.items(), key=lambda x: -x[1]):
    print(f'  [{pm}]: {count} 筆')
print(f'\n總計: {len(all_data)} 筆')

# 檢查不是 "銀行轉賬" 或 "現金" 的記錄
print('\n=== 不是「銀行轉賬」或「現金」的記錄 ===')
other = [r for r in all_data if r.get('payment_method') not in ['銀行轉賬', '現金']]
print(f'共 {len(other)} 筆:')
for r in other[:20]:  # 顯示前20筆
    pm = r.get('payment_method') or '(null)'
    item = r.get('transaction_item', '')[:40]
    income = r.get('income_amount', 0)
    expense = r.get('expense_amount', 0)
    print(f'  [{pm}] {item} | 收入:{income} 支出:{expense}')
