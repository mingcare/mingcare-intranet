const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function check() {
  // 銀行轉賬 with null deduct
  const { data: nullRecords } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, payment_method, income_amount, expense_amount, transaction_item')
    .eq('payment_method', '銀行轉賬')
    .is('deduct_from_petty_cash', null)
    .gte('transaction_date', '2025-04-01')
    .eq('is_deleted', false);
  
  console.log('=== 銀行轉賬 with deduct=null ===');
  console.log('Count:', nullRecords.length);
  nullRecords.forEach(t => {
    console.log(t.journal_number + ' | ' + t.transaction_date + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,40));
  });
  
  // 支票 with null deduct
  const { data: chequeNull } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, payment_method, income_amount, expense_amount, transaction_item')
    .eq('payment_method', '支票')
    .is('deduct_from_petty_cash', null)
    .gte('transaction_date', '2025-04-01')
    .eq('is_deleted', false);
  
  console.log('\n=== 支票 with deduct=null ===');
  console.log('Count:', chequeNull.length);
  chequeNull.forEach(t => {
    console.log(t.journal_number + ' | ' + t.transaction_date + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,40));
  });
}

check().catch(console.error);
