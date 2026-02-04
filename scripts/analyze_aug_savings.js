const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Difference: Intranet $120,691.46 vs Bank $114,671.46 = +$6,020
// Intranet Income: $218,842.36 vs Bank Credit: $222,512.36 = -$3,670 (少收)
// Intranet Expense: $230,372.67 vs Bank Debit: $240,062.67 = -$9,690 (少支)
// Net: -$3,670 + $9,690 = +$6,020

(async () => {
  console.log('=== August 2025 Savings Analysis ===\n');

  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .order('transaction_date');

  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const income = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const expense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);

  console.log('Intranet Income: $' + income.toFixed(2));
  console.log('Intranet Expense: $' + expense.toFixed(2));
  console.log('');

  // Check for 內部轉帳
  const internalTransfer = savingsTxns.filter(t => 
    t.expense_category === '內部轉帳' || t.income_category === '內部轉帳'
  );
  console.log('--- 內部轉帳 (Savings) ---');
  internalTransfer.forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + (t.income_amount||0) + ' | Exp:' + (t.expense_amount||0) + ' | ' + t.transaction_item);
  });
  const itExpense = internalTransfer.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  console.log('  Internal Transfer Expense: $' + itExpense);

  // Large expenses
  console.log('\n--- Large Expenses (>$5000) ---');
  savingsTxns.filter(t => (t.expense_amount || 0) > 5000).forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.expense_amount + ' | ' + t.expense_category + ' | ' + (t.transaction_item || '').substring(0, 40));
  });

  // Large incomes
  console.log('\n--- Large Incomes (>$5000) ---');
  savingsTxns.filter(t => (t.income_amount || 0) > 5000).forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.income_amount + ' | ' + t.income_category + ' | ' + (t.transaction_item || '').substring(0, 40));
  });

  // Check expense categories
  console.log('\n--- Expense by Category ---');
  const expByCat = {};
  savingsTxns.forEach(t => {
    const cat = t.expense_category || 'N/A';
    expByCat[cat] = (expByCat[cat] || 0) + (t.expense_amount || 0);
  });
  Object.entries(expByCat).sort((a,b) => b[1] - a[1]).forEach(([cat, amt]) => {
    if (amt > 0) console.log('  ' + cat + ': $' + amt.toFixed(2));
  });

  // Summary
  console.log('\n--- Summary ---');
  console.log('Bank Credit: $222,512.36');
  console.log('Intranet Income: $' + income.toFixed(2));
  console.log('Income Diff: $' + (222512.36 - income).toFixed(2) + ' (Bank MORE)');
  console.log('');
  console.log('Bank Debit: $240,062.67');
  console.log('Intranet Expense: $' + expense.toFixed(2));
  console.log('Expense Diff: $' + (240062.67 - expense).toFixed(2) + ' (Bank MORE)');
  console.log('');
  console.log('Net diff in closing: $' + (222512.36 - income - (240062.67 - expense)).toFixed(2));
})();
