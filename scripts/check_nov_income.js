const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30')
    .gt('income_amount', 0)
    .order('income_amount', { ascending: false });
  
  console.log('Income in Intranet (savings):');
  let total = 0;
  data.filter(d => d.deduct_from_petty_cash !== true).forEach(d => { 
    total += d.income_amount; 
    console.log('  ' + d.transaction_date.substring(5,10), d.journal_number.padEnd(15), '$' + d.income_amount.toString().padStart(7)); 
  });
  console.log('\nTotal:', total, '(Bank: 385700.29)');
  console.log('Diff:', (total - 385700.29).toFixed(2));
  
  // 睇吓邊筆可能係多咗 $600
  console.log('\n--- 可疑記錄 (係咪多入咗？) ---');
  data.filter(d => d.income_amount === 600 || d.income_amount === 300).forEach(d => {
    console.log('  ' + d.transaction_date, d.journal_number, '$' + d.income_amount, d.transaction_item);
  });
})();
