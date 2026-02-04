const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== August 2025 Savings $2,470 Difference Analysis ===\n');

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
  console.log('Bank Credit: $222,512.36');
  console.log('Income Diff: $' + (income - 222512.36).toFixed(2) + ' (Intranet - Bank)');
  console.log('');
  console.log('Intranet Expense: $' + expense.toFixed(2));
  console.log('Bank Debit: $240,062.67');
  console.log('Expense Diff: $' + (expense - 240062.67).toFixed(2) + ' (Intranet - Bank)');
  console.log('');

  // REV Analysis
  // Bank has: 2x $600 FPS Payment (Debit) + 2x $600 REV (Debit that cancels Deposit)
  // If Intranet recorded 2x $600 Deposit but not the REV cancel:
  // Intranet Income is $1,200 MORE than it should be

  console.log('--- REV Analysis ---');
  console.log('Bank REV transactions: 2 x $600 = $1,200');
  console.log('REV = reversal of FPS Deposit (沖回存款)');
  console.log('');
  console.log('If Intranet recorded the original $600 deposits but not the REV:');
  console.log('  Intranet Income would be $1,200 MORE than Bank');
  console.log('');

  // Check for $600 income records
  console.log('--- $600 Income Records ---');
  const inc600 = savingsTxns.filter(t => (t.income_amount || 0) === 600);
  inc600.forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.income_amount + ' | ' + (t.transaction_item || '').substring(0, 40));
  });
  console.log('  Count: ' + inc600.length);
  console.log('  Total: $' + inc600.reduce((sum, t) => sum + (t.income_amount || 0), 0));

  // The difference is -$2,470 (Intranet lower)
  // If REV caused $1,200 extra expense in Bank (not income), then:
  // - Bank Expense more by $1,200 -> Intranet Closing should be $1,200 HIGHER
  // But we see Intranet is $2,470 LOWER

  // Let me recalculate
  console.log('\n--- Reconciliation Math ---');
  const sOpening = 132221.77;
  console.log('Opening: $' + sOpening);
  console.log('');
  console.log('Bank: $' + sOpening + ' + $222,512.36 - $240,062.67 = $' + (sOpening + 222512.36 - 240062.67).toFixed(2));
  console.log('Intranet: $' + sOpening + ' + $' + income.toFixed(2) + ' - $' + expense.toFixed(2) + ' = $' + (sOpening + income - expense).toFixed(2));
  console.log('');
  console.log('Difference: Bank Closing - Intranet Closing = $' + ((sOpening + 222512.36 - 240062.67) - (sOpening + income - expense)).toFixed(2));
  console.log('');
  console.log('This means Intranet has:');
  console.log('  - Less Income by: $' + (222512.36 - income).toFixed(2));
  console.log('  - Less Expense by: $' + (240062.67 - expense).toFixed(2));
  console.log('  - Net: $' + ((222512.36 - income) - (240062.67 - expense)).toFixed(2) + ' (Bank higher)');
})();
