const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function list() {
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, payment_method, income_amount, expense_amount, transaction_item, income_category, expense_category')
    .eq('deduct_from_petty_cash', false)
    .eq('is_deleted', false)
    .order('transaction_date');
  
  console.log('All records with deduct_from_petty_cash = false:\n');
  data.forEach(t => {
    console.log(t.journal_number + ' | ' + t.transaction_date + ' | ' + t.payment_method + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.income_category||t.expense_category||'') + ' | ' + (t.transaction_item||'').substring(0,40));
  });
  console.log('\nTotal:', data.length);
}

list().catch(console.error);
