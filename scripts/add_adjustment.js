const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function addAdjustment() {
  // Get next journal number
  const { data: seqData } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single();
  
  const nextNumber = (seqData?.last_number || 0) + 1;
  const journalNumber = String(nextNumber).padStart(8, '0');
  
  // Insert hidden adjustment transaction
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      journal_number: journalNumber,
      transaction_code: 'ADJ-2024-001',
      fiscal_year: 2024,
      billing_month: '2024年4月',
      transaction_date: '2024-04-23',
      transaction_item: '零用金期初結轉調整',
      payment_method: '現金',
      income_category: '期初調整',
      income_amount: 320560.66,
      expense_amount: 0,
      handler: null,
      notes: '系統調整：令零用金餘額回復正確數字',
      deduct_from_petty_cash: true,
      is_deleted: false,
      created_by: 'system'
    })
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Update sequence
  await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNumber })
    .eq('id', 1);
  
  console.log('已新增期初調整交易:');
  console.log('流水號:', journalNumber);
  console.log('日期: 2024-04-23');
  console.log('金額: $320,560.66');
  console.log('');
  console.log('交易詳情:', data);
}

addAdjustment();
