const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

(async () => {
  const { data, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '支票');
  
  if (error) { console.error(error); return; }
  console.log('All 支票 transactions in June 2025:');
  data.forEach(t => {
    console.log(t.transaction_date, '|', t.journal_number, '|', t.transaction_item?.substring(0,50), '| inc:', t.income_amount, '| exp:', t.expense_amount);
  });
  
  const totalInc = data.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const totalExp = data.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  console.log('\nTotal Income:', totalInc, '| Total Expense:', totalExp);
})();
