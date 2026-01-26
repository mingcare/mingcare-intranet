#!/usr/bin/env python3
"""模擬前端過濾邏輯"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得所有交易
all_data = []
offset = 0
while True:
    result = supabase.table('financial_transactions').select('*').range(offset, offset + 999).execute()
    all_data.extend(result.data)
    if len(result.data) < 1000:
        break
    offset += 1000

print(f'總交易數: {len(all_data)}')

# 模擬 getLedgerTransactions 邏輯
# 銀行轉賬 + 不從零用金扣除的現金支出
ledger = [t for t in all_data if 
    t.get('payment_method') == '銀行轉賬' or
    (t.get('payment_method') == '現金' and (t.get('expense_amount') or 0) > 0 and t.get('deduct_from_petty_cash') == False)
]
print(f'流水帳 (Ledger): {len(ledger)} 筆')

# 模擬 getPettyCashTransactions 邏輯
# 現金交易（deduct_from_petty_cash !== false）
petty_cash = [t for t in all_data if 
    t.get('payment_method') == '現金' and 
    t.get('deduct_from_petty_cash') != False  # null 或 true 都顯示
]
print(f'零用金 (Petty Cash): {len(petty_cash)} 筆')

# 計算未顯示的
shown = set()
for t in ledger:
    shown.add(t['id'])
for t in petty_cash:
    shown.add(t['id'])

not_shown = [t for t in all_data if t['id'] not in shown]
print(f'\n=== 未顯示的交易: {len(not_shown)} 筆 ===')

if not_shown:
    for t in not_shown[:30]:
        pm = t.get('payment_method') or '(null)'
        item = (t.get('transaction_item') or '')[:50]
        income = t.get('income_amount', 0)
        expense = t.get('expense_amount', 0)
        deduct = t.get('deduct_from_petty_cash')
        date = t.get('transaction_date', '')
        print(f'  [{pm}] {date} | {item} | 收入:{income} 支出:{expense} | deduct:{deduct}')
