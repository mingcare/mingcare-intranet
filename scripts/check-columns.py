#!/usr/bin/env python3
"""檢查 financial_transactions 表的欄位"""

from supabase import create_client

url = 'https://cvkxlvdicympakfecgvv.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
supabase = create_client(url, key)

# 取得一筆記錄看有哪些欄位
result = supabase.table('financial_transactions').select('*').limit(1).execute()
if result.data:
    print('financial_transactions 表的欄位:')
    for key in sorted(result.data[0].keys()):
        value = result.data[0][key]
        print(f'  {key}: {type(value).__name__} = {value}')
    
    # 檢查是否有 is_deleted 欄位
    if 'is_deleted' in result.data[0]:
        print('\n✅ 有 is_deleted 欄位')
    else:
        print('\n❌ 沒有 is_deleted 欄位！')
    
    if 'deleted_at' in result.data[0]:
        print('✅ 有 deleted_at 欄位')
    else:
        print('❌ 沒有 deleted_at 欄位')
