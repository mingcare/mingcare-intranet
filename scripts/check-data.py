#!/usr/bin/env python3
import os
from supabase import create_client

url = "https://cvkxlvdicympakfecgvv.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI"
supabase = create_client(url, key)

print("=" * 50)
print("會計系統數據檢查")
print("=" * 50)

# 總數
total = supabase.table('financial_transactions').select('id', count='exact').execute()
print(f'\n總交易數: {total.count}')

# 按年份統計
print("\n按年份統計:")
for year in [2024, 2025, 2026]:
    result = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', year).execute()
    print(f'  {year}年: {result.count} 筆')

# 檢查是否有 is_deleted = true 的記錄
try:
    deleted = supabase.table('financial_transactions').select('id', count='exact').eq('is_deleted', True).execute()
    print(f'\n已刪除記錄: {deleted.count}')
except Exception as e:
    print(f'\nis_deleted 欄位可能不存在: {e}')

# 按付款方式統計
print("\n按付款方式統計:")
result = supabase.table('financial_transactions').select('payment_method').execute()
payment_counts = {}
for r in result.data:
    pm = r.get('payment_method', '未知')
    payment_counts[pm] = payment_counts.get(pm, 0) + 1
for pm, count in sorted(payment_counts.items(), key=lambda x: -x[1]):
    print(f'  {pm}: {count} 筆')

# 檢查流水帳和零用金的數量
print("\n流水帳 (銀行轉賬):")
bank = supabase.table('financial_transactions').select('id', count='exact').eq('payment_method', '銀行轉賬').execute()
print(f'  銀行轉賬: {bank.count} 筆')

print("\n零用金 (現金):")
cash = supabase.table('financial_transactions').select('id', count='exact').eq('payment_method', '現金').execute()
print(f'  現金: {cash.count} 筆')

# 檢查是否有特定項目
print("\n檢查部分數據樣本:")
sample = supabase.table('financial_transactions').select('journal_number, transaction_date, transaction_item, payment_method, income_amount, expense_amount').order('transaction_date', desc=False).limit(10).execute()
for r in sample.data:
    print(f"  {r['journal_number']} | {r['transaction_date']} | {r['transaction_item'][:30]}... | {r['payment_method']} | 收:{r['income_amount']} 支:{r['expense_amount']}")

print("\n" + "=" * 50)
