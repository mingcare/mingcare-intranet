#!/usr/bin/env python3
"""分析 2026 年的交易分類"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得 2026 年的所有交易
result = supabase.table('financial_transactions').select('*').eq('fiscal_year', 2026).order('transaction_date').execute()

print(f'=== 2026年交易分類分析 ({len(result.data)} 筆) ===\n')

# 模擬前端的過濾邏輯
# 流水帳: 銀行轉賬 + 不從零用金扣除的現金支出
ledger = [t for t in result.data if 
    t.get('payment_method') == '銀行轉賬' or
    (t.get('payment_method') == '現金' and (t.get('expense_amount') or 0) > 0 and t.get('deduct_from_petty_cash') == False)
]

# 零用金: 現金交易（deduct_from_petty_cash !== false）
petty_cash = [t for t in result.data if 
    t.get('payment_method') == '現金' and 
    t.get('deduct_from_petty_cash') != False
]

print(f'流水帳應顯示: {len(ledger)} 筆')
print(f'零用金應顯示: {len(petty_cash)} 筆')

print('\n=== 流水帳項目 ===')
for t in ledger:
    jn = t.get('journal_number', '')
    date = t.get('transaction_date', '')
    pm = t.get('payment_method', '')
    item = (t.get('transaction_item', '') or '')[:40]
    print(f'{jn} | {date} | {pm} | {item}')

print('\n=== 零用金項目 ===')
for t in petty_cash[:20]:  # 只顯示前20筆
    jn = t.get('journal_number', '')
    date = t.get('transaction_date', '')
    item = (t.get('transaction_item', '') or '')[:40]
    income = t.get('income_amount', 0) or 0
    expense = t.get('expense_amount', 0) or 0
    print(f'{jn} | {date} | 收:{income} 支:{expense} | {item}')
print(f'... (共 {len(petty_cash)} 筆)')
