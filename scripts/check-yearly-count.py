#!/usr/bin/env python3
"""檢查每年的交易數量"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 按年統計
for year in [2024, 2025, 2026]:
    result = supabase.table('financial_transactions').select('id', count='exact').eq('fiscal_year', year).execute()
    print(f'{year}年: {result.count} 筆')

# 檢查 2025 年有多少筆
result = supabase.table('financial_transactions').select('id').eq('fiscal_year', 2025).execute()
print(f'\n2025年實際取得: {len(result.data)} 筆 (可能被截斷)')
