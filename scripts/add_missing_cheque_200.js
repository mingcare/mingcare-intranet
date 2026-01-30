const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function addMissingCheque() {
  // 獲取下一個流水號
  const { data: seqData } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single()

  const nextNumber = seqData.last_number + 1
  const journalNumber = String(nextNumber).padStart(8, '0')

  // 添加缺少的支票交易 (29-Apr-25, $200, 支票號碼 000062)
  const record = {
    journal_number: journalNumber,
    transaction_code: '',
    fiscal_year: 2025,
    billing_month: '2025年4月',
    transaction_date: '2025-04-29',
    transaction_item: '支票支出 (支票號碼 000062)',
    payment_method: '支票',
    income_category: null,
    income_amount: 0,
    expense_category: '其他支出',
    expense_amount: 200,
    deduct_from_petty_cash: false,
    notes: 'DBS Current Account 002520252',
    created_by: 'system'
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(record)
    .select()

  if (error) {
    console.error('Error:', error)
    return
  }

  // 更新流水號序列
  await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNumber })
    .eq('id', 1)

  console.log(`✅ 已添加支票交易: ${journalNumber} | 2025-04-29 | $200 | 支票號碼 000062`)
}

addMissingCheque()
