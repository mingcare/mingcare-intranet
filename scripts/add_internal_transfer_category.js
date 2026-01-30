const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function addCategories() {
  // 添加到 income_categories
  const { data: income, error: err1 } = await supabase.from('income_categories').insert({
    name: '內部轉帳',
    color: '#3B82F6',
    is_active: true,
    sort_order: 99
  }).select()
  console.log('Added income category:', income, err1)
  
  // 添加到 expense_categories
  const { data: expense, error: err2 } = await supabase.from('expense_categories').insert({
    name: '內部轉帳',
    color: '#3B82F6',
    is_active: true,
    sort_order: 99
  }).select()
  console.log('Added expense category:', expense, err2)
}

addCategories()
