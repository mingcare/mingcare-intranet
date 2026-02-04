const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Get all December savings account income (not petty cash)
  const { data: income, error: e1 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('income_amount', 0)
    .eq('bank_account', '002113176')
    .neq('deduct_from_petty_cash', true);
  
  if (e1) console.log('Error:', e1);
  
  console.log('=== December Savings Account INCOME ===');
  console.log('Records:', income.length);
  
  let totalIncome = 0;
  income.forEach(r => {
    const amt = parseFloat(r.income_amount);
    totalIncome += amt;
    console.log(r.transaction_date, r.journal_number.padEnd(20), 
      ('$' + amt.toFixed(2)).padStart(12),
      r.payment_method?.padEnd(10) || '',
      r.transaction_item?.substring(0, 35));
  });
  console.log('\nTotal Intranet Income:', totalIncome.toFixed(2));
  console.log('Bank Credit Total:', 500252.68);
  console.log('Difference:', (500252.68 - totalIncome).toFixed(2));
  
  // Now check expense
  console.log('\n\n=== December Savings Account EXPENSE ===');
  const { data: expense, error: e2 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('expense_amount', 0)
    .eq('bank_account', '002113176')
    .neq('deduct_from_petty_cash', true);
  
  if (e2) console.log('Error:', e2);
  
  console.log('Records:', expense.length);
  
  let totalExpense = 0;
  expense.forEach(r => {
    const amt = parseFloat(r.expense_amount);
    totalExpense += amt;
    console.log(r.transaction_date, r.journal_number.padEnd(20), 
      ('$' + amt.toFixed(2)).padStart(12),
      r.payment_method?.padEnd(10) || '',
      r.transaction_item?.substring(0, 35));
  });
  console.log('\nTotal Intranet Expense:', totalExpense.toFixed(2));
  console.log('Bank Debit Total:', 353572.20);
  console.log('Difference:', (totalExpense - 353572.20).toFixed(2));
  
  // Summary
  console.log('\n\n=== RECONCILIATION SUMMARY ===');
  console.log('Opening Balance: $14,923.59');
  console.log('+ Income:', totalIncome.toFixed(2), '(Bank: 500,252.68)');
  console.log('- Expense:', totalExpense.toFixed(2), '(Bank: 353,572.20)');
  console.log('= Closing:', (14923.59 + totalIncome - totalExpense).toFixed(2));
  console.log('Bank Closing: $161,604.07');
})();
