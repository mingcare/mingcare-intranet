const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function addInternalTransfer() {
  // 獲取下一個流水號
  const { data: seqData, error: seqError } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single()

  if (seqError) {
    console.error('Error getting sequence:', seqError)
    return
  }

  let nextNumber = seqData.last_number + 1
  const journalNumber1 = String(nextNumber).padStart(8, '0')
  const journalNumber2 = String(nextNumber + 1).padStart(8, '0')

  console.log('準備添加內部轉帳記錄...')
  console.log(`流水號1: ${journalNumber1} (儲蓄戶口轉出)`)
  console.log(`流水號2: ${journalNumber2} (支票戶口轉入)`)

  // 1. 儲蓄戶口支出 - 轉到支票戶口
  const savingsRecord = {
    journal_number: journalNumber1,
    fiscal_year: 2025,
    billing_month: '2025年4月',
    transaction_date: '2025-04-03',
    transaction_item: '內部轉帳 - 轉到支票戶口 (Ref: 1513RF1208487)',
    payment_method: '銀行轉賬',
    expense_category: '內部轉帳',
    expense_amount: 13470,
    income_amount: 0,
    deduct_from_petty_cash: false,
    notes: '儲蓄戶口 002113176 → 支票戶口 002520252',
    created_by: 'system',
    sort_order: 50
  }

  // 2. 支票戶口收入 - 從儲蓄戶口轉入
  const currentRecord = {
    journal_number: journalNumber2,
    fiscal_year: 2025,
    billing_month: '2025年4月',
    transaction_date: '2025-04-03',
    transaction_item: '內部轉帳 - 從儲蓄戶口轉入 (Ref: 1513RF1208487)',
    payment_method: '支票',  // 標記為支票戶口
    income_category: '內部轉帳',
    income_amount: 13470,
    expense_amount: 0,
    deduct_from_petty_cash: false,
    notes: '儲蓄戶口 002113176 → 支票戶口 002520252',
    created_by: 'system',
    sort_order: 51
  }

  // 插入記錄
  const { data: data1, error: error1 } = await supabase
    .from('financial_transactions')
    .insert(savingsRecord)
    .select()

  if (error1) {
    console.error('Error inserting savings record:', error1)
    return
  }

  const { data: data2, error: error2 } = await supabase
    .from('financial_transactions')
    .insert(currentRecord)
    .select()

  if (error2) {
    console.error('Error inserting current record:', error2)
    return
  }

  // 更新流水號序列
  const { error: updateError } = await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNumber + 1 })
    .eq('id', 1)

  if (updateError) {
    console.error('Error updating sequence:', updateError)
    return
  }

  console.log('\n✅ 內部轉帳記錄已添加：')
  console.log(`   ${journalNumber1} | 儲蓄戶口支出 | $13,470`)
  console.log(`   ${journalNumber2} | 支票戶口收入 | $13,470`)
}

addInternalTransfer()
