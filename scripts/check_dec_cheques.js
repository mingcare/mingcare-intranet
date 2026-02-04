const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '支票')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('expense_amount', 0)
    .order('expense_amount', { ascending: false });
  
  console.log('支票戶口 Expense (Dec):');
  let total = 0;
  data.forEach(d => { 
    total += d.expense_amount; 
    console.log(' ', d.transaction_date.substring(5,10), d.journal_number.padEnd(15), '$' + d.expense_amount); 
  });
  console.log('\nTotal:', total, '(Bank: 87679)');
  console.log('Bank breakdown: 57874 + 3505 + 2725 + 10575 + 13000 =', 57874+3505+2725+10575+13000);
  console.log('\nMissing: $57,874 (支票 #112 on 09-Dec)');
})();
