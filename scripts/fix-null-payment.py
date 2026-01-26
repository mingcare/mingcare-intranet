#!/usr/bin/env python3
"""Fix null payment_method records"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# Find null payment_method
result = supabase.table('financial_transactions').select('journal_number, transaction_date, transaction_item, income_amount, expense_amount').is_('payment_method', 'null').execute()

print(f'Found {len(result.data)} records with null payment_method:')
for r in result.data:
    print(f"  {r['journal_number']} | {r['transaction_date']} | {r['transaction_item'][:40]}")

# Fix them - set to 銀行轉賬 if income > 0, otherwise 現金
for r in result.data:
    pm = '銀行轉賬' if (r['income_amount'] or 0) > 0 else '現金'
    supabase.table('financial_transactions').update({'payment_method': pm}).eq('journal_number', r['journal_number']).execute()
    print(f"  Fixed {r['journal_number']} -> {pm}")

print('Done!')

# Verify
result2 = supabase.table('financial_transactions').select('id', count='exact').is_('payment_method', 'null').execute()
print(f'Remaining null payment_method: {result2.count}')
