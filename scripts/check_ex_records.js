const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

(async () => {
  const { data, error } = await supabase.from('financial_transactions')
    .select('*')
    .in('journal_number', ['EX-0032', 'EX-0033', '00001841']);
  
  if (error) { console.error(error); return; }
  data.forEach(t => {
    console.log('---');
    console.log('Journal:', t.journal_number);
    console.log('Date:', t.transaction_date);
    console.log('Item:', t.transaction_item);
    console.log('Income:', t.income_amount, '| Expense:', t.expense_amount);
    console.log('Income Cat:', t.income_category, '| Expense Cat:', t.expense_category);
    console.log('Payment:', t.payment_method);
    console.log('Notes:', t.notes);
    console.log('Created:', t.created_at);
  });
})();
