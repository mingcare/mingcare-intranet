#!/usr/bin/env python3
"""Complete verification of database and intranet logic"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

print('=' * 60)
print('DATABASE & INTRANET LOGIC VERIFICATION')
print('=' * 60)

# 1. Total records
total = supabase.table('financial_transactions').select('id', count='exact').execute()
print(f'\n1. Total records: {total.count}')

# 2. Sequence table
seq = supabase.table('global_journal_sequence').select('*').execute()
print(f'2. Sequence last_number: {seq.data[0]["last_number"]}')

# 3. By year
print(f'3. Records by year:')
for year in [2024, 2025, 2026]:
    count = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', year).execute()
    print(f'   {year}: {count.count}')

# 4. Payment methods (paginated)
all_data = []
offset = 0
while True:
    result = supabase.table('financial_transactions').select('payment_method, deduct_from_petty_cash, income_amount, expense_amount').range(offset, offset + 999).execute()
    all_data.extend(result.data)
    if len(result.data) < 1000:
        break
    offset += 1000

pm_counts = {}
for r in all_data:
    pm = r.get('payment_method') or '(null)'
    pm_counts[pm] = pm_counts.get(pm, 0) + 1
print(f'4. Payment methods:')
for pm, count in sorted(pm_counts.items(), key=lambda x: -x[1]):
    print(f'   {pm}: {count}')

# 5. Simulate frontend filter logic
print(f'\n5. Simulating frontend filter logic:')

# Ledger: 銀行轉賬 + (現金 + expense > 0 + deduct_from_petty_cash === false)
ledger = [t for t in all_data if 
    t.get('payment_method') == '銀行轉賬' or
    (t.get('payment_method') == '現金' and (t.get('expense_amount') or 0) > 0 and t.get('deduct_from_petty_cash') == False)
]
print(f'   Ledger (流水帳): {len(ledger)} records')

# Petty Cash: 現金 + deduct_from_petty_cash !== false
petty = [t for t in all_data if 
    t.get('payment_method') == '現金' and 
    t.get('deduct_from_petty_cash') != False
]
print(f'   Petty Cash (零用金): {len(petty)} records')

# Check if all records are covered
shown_ids = set()
bank_only = [t for t in all_data if t.get('payment_method') == '銀行轉賬']
cash_only = [t for t in all_data if t.get('payment_method') == '現金']
print(f'   Bank transfers: {len(bank_only)}')
print(f'   Cash: {len(cash_only)}')
print(f'   Ledger + Petty Cash (unique): ~{len(ledger) + len(petty)} (some may overlap)')

# 6. Test auto-generation
print(f'\n6. Testing auto-generation trigger...')
test = {
    'billing_month': '2026年1月',
    'transaction_date': '2026-01-26',
    'transaction_item': 'TEST_AUTO_GEN',
    'payment_method': '現金',
    'fiscal_year': 2026,
}
result = supabase.table('financial_transactions').insert(test).execute()
new_jn = result.data[0]['journal_number']
print(f'   New journal_number: {new_jn}')

# Delete test
supabase.table('financial_transactions').delete().eq('journal_number', new_jn).execute()
print(f'   Test record deleted')

# New sequence
seq2 = supabase.table('global_journal_sequence').select('*').execute()
print(f'   Sequence now: {seq2.data[0]["last_number"]}')

# 7. Check for null/missing values
print(f'\n7. Data quality check:')
null_pm = len([t for t in all_data if not t.get('payment_method')])
print(f'   Records with null payment_method: {null_pm}')

print('\n' + '=' * 60)
print('VERIFICATION COMPLETE')
print('=' * 60)
