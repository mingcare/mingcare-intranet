const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

(async () => {
  const { data, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '銀行轉賬')
    .order('transaction_date');
  
  if (error) { console.error(error); return; }
  
  console.log('June 2025 銀行轉賬 transactions:\n');
  
  let totalInc = 0;
  let totalExp = 0;
  
  data.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    totalInc += inc;
    totalExp += exp;
    console.log(`${t.transaction_date} | ${t.journal_number.padEnd(10)} | ${(t.transaction_item || '').substring(0,35).padEnd(35)} | +$${inc.toFixed(2).padStart(10)} | -$${exp.toFixed(2).padStart(10)}`);
  });
  
  console.log('\n' + '='.repeat(100));
  console.log(`Total Income: $${totalInc.toFixed(2)}`);
  console.log(`Total Expense: $${totalExp.toFixed(2)}`);
  console.log(`Net: $${(totalInc - totalExp).toFixed(2)}`);
  
  const opening = 41078.53;
  const closing = opening + totalInc - totalExp;
  console.log(`\nOpening: $${opening.toFixed(2)}`);
  console.log(`Closing: $${closing.toFixed(2)}`);
  console.log(`Bank Closing: $70,815.21`);
  console.log(`Diff: $${(70815.21 - closing).toFixed(2)}`);
})();
