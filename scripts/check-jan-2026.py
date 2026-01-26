#!/usr/bin/env python3
"""檢查 2026年1月的所有交易"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得 2026年 的所有交易
result = supabase.table('financial_transactions').select('*').eq('fiscal_year', 2026).order('journal_number').execute()

print(f'=== 2026年所有交易 ({len(result.data)} 筆) ===\n')
print(f'{"序號":<10} {"日期":<12} {"付款方式":<10} {"收入":<12} {"支出":<12} {"交易項目"}')
print('-' * 100)

for t in result.data:
    jn = t.get('journal_number', '')
    date = t.get('transaction_date', '')
    pm = t.get('payment_method', '') or '(null)'
    income = t.get('income_amount', 0) or 0
    expense = t.get('expense_amount', 0) or 0
    item = (t.get('transaction_item', '') or '')[:40]
    deduct = t.get('deduct_from_petty_cash')
    
    # 標記顯示位置
    if pm == '銀行轉賬':
        view = '[流水帳]'
    elif pm == '現金' and deduct == False:
        view = '[流水帳]'  # 現金但不扣零用金
    elif pm == '現金':
        view = '[零用金]'
    else:
        view = '[???]'
    
    print(f'{jn:<10} {date:<12} {pm:<10} {income:<12.2f} {expense:<12.2f} {item} {view}')

# 統計
bank = [t for t in result.data if t.get('payment_method') == '銀行轉賬']
cash = [t for t in result.data if t.get('payment_method') == '現金']
cash_ledger = [t for t in cash if t.get('deduct_from_petty_cash') == False]
cash_petty = [t for t in cash if t.get('deduct_from_petty_cash') != False]

print(f'\n=== 統計 ===')
print(f'總數: {len(result.data)}')
print(f'流水帳: {len(bank) + len(cash_ledger)} (銀行轉賬:{len(bank)} + 現金不扣零用金:{len(cash_ledger)})')
print(f'零用金: {len(cash_petty)}')
