const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Checking August 2025 Internal Transfers ===\n');

  // Check for internal transfers in August
  const { data: itTxns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .or('expense_category.eq.內部轉帳,income_category.eq.內部轉帳')
    .order('transaction_date');

  console.log('Internal Transfer records in August 2025:', itTxns?.length || 0);
  if (itTxns && itTxns.length > 0) {
    itTxns.forEach(t => {
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + (t.income_amount||0) + ' | Exp:' + (t.expense_amount||0) + ' | ' + t.payment_method + ' | ' + t.transaction_item);
    });
  }

  // Check for $8490 amount
  console.log('\n--- Records with $8490 amount ---');
  const { data: amt8490 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .or('expense_amount.eq.8490,income_amount.eq.8490');

  if (amt8490 && amt8490.length > 0) {
    amt8490.forEach(t => {
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + (t.income_amount||0) + ' | Exp:' + (t.expense_amount||0) + ' | ' + t.payment_method + ' | ' + t.transaction_item);
    });
  } else {
    console.log('  No records found with $8490');
  }

  // Check Bank Interest
  console.log('\n--- Bank Interest in August ---');
  const { data: interest } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .ilike('transaction_item', '%利息%');

  if (interest && interest.length > 0) {
    interest.forEach(t => {
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + (t.income_amount||0) + ' | ' + t.transaction_item);
    });
  } else {
    console.log('  No interest records');
  }

  // Bank statement says: Interest $7.36
  console.log('\n--- Summary ---');
  console.log('Bank says:');
  console.log('  - Internal Transfer (Savings out): $8,490 on 06-Aug');
  console.log('  - Interest: $7.36 on 30-Aug');
  console.log('');
  console.log('Missing from Intranet:');
  console.log('  - Internal Transfer expense: $8,490 (儲蓄轉支票)');
  console.log('');
  console.log('Difference Analysis:');
  console.log('  Bank Credit: $222,512.36');
  console.log('  Intranet Income: $218,842.36');
  console.log('  Diff: $3,670 (Bank has more income)');
  console.log('');
  console.log('  Bank Debit: $240,062.67');
  console.log('  Intranet Expense: $230,372.67');
  console.log('  Diff: $9,690 (Bank has more expense)');
  console.log('');
  console.log('  If we add $8,490 internal transfer expense:');
  console.log('  New Intranet Expense: $' + (230372.67 + 8490).toFixed(2));
  console.log('  Still diff: $' + (240062.67 - 230372.67 - 8490).toFixed(2));
})();
