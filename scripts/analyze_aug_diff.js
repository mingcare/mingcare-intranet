const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== August 2025 Savings Difference Analysis ===\n');

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

  // Bank fees
  console.log('--- Bank Fees (手續費) ---');
  const fees = savingsTxns.filter(t => 
    (t.expense_category || '').includes('手續費') || 
    (t.transaction_item || '').includes('手續費') ||
    (t.transaction_item || '').includes('FPS')
  );
  fees.forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.expense_amount + ' | ' + t.transaction_item);
  });
  const totalFees = fees.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  console.log('  Total Fees in Intranet: $' + totalFees);
  console.log('  Bank FPS Fees: 30 x $5 = $150');

  // Internal transfer check
  console.log('\n--- Internal Transfer ---');
  const it = savingsTxns.filter(t => 
    t.expense_category === '內部轉帳' || 
    (t.transaction_item || '').includes('內部轉')
  );
  console.log('  Found:', it.length);
  it.forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.expense_amount);
  });
  console.log('  Bank Internal Transfer: $8,490 (Savings → Current)');

  // Breakdown of differences
  console.log('\n--- Difference Breakdown ---');
  console.log('Bank Debit: $240,062.67');
  console.log('Intranet Expense: $' + savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0).toFixed(2));
  console.log('');
  console.log('Missing from Intranet (Expense):');
  console.log('  - Internal Transfer: $8,490');
  console.log('  - FPS Fees: $150 (if not recorded)');
  console.log('  - Others: $' + (9690 - 8490 - 150).toFixed(2));
  console.log('');
  console.log('Bank Credit: $222,512.36');
  console.log('Intranet Income: $' + savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0).toFixed(2));
  console.log('');
  console.log('Missing from Intranet (Income):');
  console.log('  - Difference: $3,670');

  // Check REV transactions in bank
  console.log('\n--- Note: Check Bank Statement for REV ---');
  console.log('REV 差異 normally net to zero, acceptable');
})();
