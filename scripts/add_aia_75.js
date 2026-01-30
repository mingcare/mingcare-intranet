const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function addTransaction() {
  // Get next journal number
  const { data: seq } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .single();
  
  const nextNum = (seq?.last_number || 0) + 1;
  const journalNumber = String(nextNum).padStart(8, '0');
  
  // Insert transaction
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      journal_number: journalNumber,
      fiscal_year: 2025,
      billing_month: '2025年4月',
      transaction_date: '2025-04-24',
      transaction_item: 'AIA CO (T) LTD 保險',
      payment_method: '銀行轉賬',
      expense_category: '保險',
      expense_amount: 75,
      income_amount: 0,
      handler: 'Joe Cheung',
      created_by: 'system'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Update sequence
  await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNum })
    .eq('id', 1);
  
  console.log('✅ 已新增交易');
  console.log('流水號:', journalNumber);
  console.log('日期:', data.transaction_date);
  console.log('項目:', data.transaction_item);
  console.log('金額: $' + data.expense_amount);
}

addTransaction();
