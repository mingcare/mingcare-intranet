#!/usr/bin/env python3
"""詳細分析流水號缺失問題"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得所有交易的流水號
all_data = []
offset = 0
while True:
    result = supabase.table('financial_transactions').select('journal_number, transaction_date, transaction_item, payment_method, income_amount, expense_amount, is_deleted, deleted_at').order('journal_number').range(offset, offset + 999).execute()
    all_data.extend(result.data)
    if len(result.data) < 1000:
        break
    offset += 1000

print(f'總交易數: {len(all_data)}')

# 取得所有流水號（轉為整數）
journal_numbers = []
for t in all_data:
    jn = t.get('journal_number')
    if jn:
        try:
            journal_numbers.append(int(jn))
        except:
            pass

journal_numbers.sort()

print(f'流水號範圍: {min(journal_numbers)} - {max(journal_numbers)}')
print(f'預期總數: {max(journal_numbers) - min(journal_numbers) + 1}')
print(f'實際總數: {len(journal_numbers)}')

# 找出缺失的流水號
expected = set(range(min(journal_numbers), max(journal_numbers) + 1))
actual = set(journal_numbers)
missing = sorted(expected - actual)

print(f'\n=== 缺失的流水號 ({len(missing)} 個) ===')
for m in missing:
    print(f'  {str(m).zfill(8)}')

# 特別檢查 1714
print(f'\n=== 檢查 00001714 ===')
result = supabase.table('financial_transactions').select('*').eq('journal_number', '00001714').execute()
if result.data:
    t = result.data[0]
    print('找到記錄:')
    for k, v in t.items():
        print(f'  {k}: {v}')
else:
    print('數據庫中沒有 00001714 這筆記錄！')

# 檢查 1713-1720 的記錄
print(f'\n=== 流水號 1713-1720 詳情 ===')
for num in range(1713, 1721):
    jn = str(num).zfill(8)
    result = supabase.table('financial_transactions').select('journal_number, transaction_date, transaction_item, payment_method, is_deleted').eq('journal_number', jn).execute()
    if result.data:
        t = result.data[0]
        deleted = '(已刪除)' if t.get('is_deleted') else ''
        print(f'{jn}: {t.get("transaction_date")} | {t.get("payment_method")} | {t.get("transaction_item")[:40]} {deleted}')
    else:
        print(f'{jn}: *** 不存在 ***')
