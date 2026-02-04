const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Search for $57,874 or similar amounts
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('expense_amount', 57000)
    .lte('expense_amount', 58000)
    .gte('transaction_date', '2025-11-01')
    .order('transaction_date');
  
  console.log('Records with expense ~$57,874:');
  data.forEach(d => console.log(' ', d.transaction_date, d.journal_number, d.expense_amount, d.payment_method, d.transaction_item?.substring(0,30)));
  
  if (data.length === 0) {
    console.log('  (none found - need to add cheque #112 $57,874)');
  }
})();
