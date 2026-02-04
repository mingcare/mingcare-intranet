const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Check records that might belong to January 2026
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-12-20')
    .lte('transaction_date', '2025-12-31')
    .or('expense_amount.gt.5000,income_amount.gt.5000')
    .order('transaction_date');
  
  console.log('Late December large transactions (銀行轉賬):');
  data.filter(d => d.deduct_from_petty_cash !== true).forEach(d => {
    console.log(' ', d.transaction_date, d.journal_number.padEnd(15), 
      d.income_amount > 0 ? 'Inc $' + d.income_amount : 'Exp $' + d.expense_amount,
      d.transaction_item?.substring(0, 35));
  });
  
  // Check billing_month for inconsistencies
  console.log('\n\nDecember records with non-December billing_month:');
  const { data: all } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .not('billing_month', 'like', '%12月%');
  
  all.forEach(d => {
    console.log(' ', d.journal_number, d.billing_month, d.transaction_item?.substring(0, 30));
  });
})();
