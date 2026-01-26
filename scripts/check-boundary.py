#!/usr/bin/env python3
"""檢查 2025年12月底和2026年1月初的交易"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得 1710-1730 的交易
print('=== 流水號 1710-1730 詳情 ===')
print(f'{"流水號":<10} {"fiscal_year":<12} {"日期":<12} {"付款方式":<10} {"交易項目"}')
print('-' * 90)

for num in range(1710, 1731):
    jn = str(num).zfill(8)
    result = supabase.table('financial_transactions').select('*').eq('journal_number', jn).execute()
    if result.data:
        t = result.data[0]
        fy = t.get('fiscal_year', '')
        date = t.get('transaction_date', '')
        pm = t.get('payment_method', '') or ''
        item = (t.get('transaction_item', '') or '')[:35]
        print(f'{jn:<10} {fy:<12} {date:<12} {pm:<10} {item}')

# 分析問題
print('\n=== 分析 ===')
print('如果你選擇「2026年」，會顯示 fiscal_year = 2026 的記錄')
print('00001714 的 fiscal_year = 2025，所以在 2026 年視圖不會顯示')
print('')
print('如果你選擇「2026年」+ 「流水帳」視圖，會顯示:')
print('  - fiscal_year = 2026')
print('  - 付款方式 = 銀行轉賬 (或 現金 + deduct_from_petty_cash = false)')
