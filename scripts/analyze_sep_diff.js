const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// September 2025 Bank Statement (Savings)
// Opening: $114,671.46
// Closing: $180,669.99
// Credit: $420,898.53
// Debit: $354,900.00

(async () => {
  // Get September 2025 銀行轉賬 transactions for Savings account
  const { data, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false)
    .order('transaction_date');
  
  if (error) { console.error(error); return; }
  
  console.log('=== September 2025 儲蓄戶口 (銀行轉賬, deduct=false) ===\n');
  let totalIncome = 0, totalExpense = 0;
  
  data.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    totalIncome += inc;
    totalExpense += exp;
    console.log(
      t.transaction_date, 
      t.journal_number.padEnd(15), 
      (inc ? '+' + inc : '').padStart(10),
      (exp ? '-' + exp : '').padStart(10),
      t.expense_category || t.income_category || ''
    );
  });
  
  console.log('');
  console.log('Intranet Total Income:', totalIncome);
  console.log('Intranet Total Expense:', totalExpense);
  console.log('Intranet Net:', totalIncome - totalExpense);
  
  console.log('');
  console.log('Bank Statement Credit: 420,898.53');
  console.log('Bank Statement Debit: 354,900.00');
  console.log('Bank Statement Net: 65,998.53');
  
  console.log('');
  console.log('Income Diff (Bank - Intranet):', 420898.53 - totalIncome);
  console.log('Expense Diff (Bank - Intranet):', 354900 - totalExpense);
  console.log('Net Diff:', 65998.53 - (totalIncome - totalExpense));
})();
