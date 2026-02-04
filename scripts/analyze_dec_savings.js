const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== December Savings Account Analysis ===\n');
  
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31');
  
  const valid = data.filter(d => d.deduct_from_petty_cash !== true);
  
  // Income
  console.log('Income (Savings):');
  let totalInc = 0;
  valid.filter(d => d.income_amount > 0).sort((a,b) => b.income_amount - a.income_amount).forEach(d => {
    totalInc += d.income_amount;
    console.log(' ', d.transaction_date.substring(5,10), d.journal_number.padEnd(15), '$' + d.income_amount.toString().padStart(8));
  });
  console.log('\nTotal Income:', totalInc.toFixed(2), '(Bank: 500,252.68)');
  console.log('Diff:', (500252.68 - totalInc).toFixed(2));
  
  // Expense
  console.log('\n\nExpense (Savings):');
  let totalExp = 0;
  valid.filter(d => d.expense_amount > 0).sort((a,b) => b.expense_amount - a.expense_amount).slice(0, 30).forEach(d => {
    totalExp += d.expense_amount;
    console.log(' ', d.transaction_date.substring(5,10), d.journal_number.padEnd(15), '$' + d.expense_amount.toString().padStart(8));
  });
  const remaining = valid.filter(d => d.expense_amount > 0).slice(30);
  remaining.forEach(d => totalExp += d.expense_amount);
  console.log('  ...and', remaining.length, 'more records');
  console.log('\nTotal Expense:', totalExp.toFixed(2), '(Bank: 353,572.20)');
  console.log('Diff:', (totalExp - 353572.20).toFixed(2));
})();
