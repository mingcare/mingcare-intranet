const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Searching for $2,470 transaction ===\n');

  // Search for $2470 amount
  const { data: t2470 } = await supabase.from('financial_transactions')
    .select('*')
    .or('income_amount.eq.2470,expense_amount.eq.2470');

  console.log('Records with $2,470:');
  if (t2470 && t2470.length > 0) {
    t2470.forEach(t => {
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + (t.income_amount||0) + ' | Exp:' + (t.expense_amount||0) + ' | ' + t.transaction_item);
    });
  } else {
    console.log('  NONE FOUND');
  }

  // Search for MS YU or 余 (common surname)
  console.log('\n--- August 2025 transactions with "余" or "Yu" ---');
  const { data: aug } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .or('transaction_item.ilike.%余%,transaction_item.ilike.%Yu%')
    .order('transaction_date');

  if (aug && aug.length > 0) {
    aug.forEach(t => {
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + (t.income_amount||0) + ' | Exp:' + (t.expense_amount||0) + ' | ' + (t.transaction_item || '').substring(0, 50));
    });
  }

  // Bank statement shows: 18-Aug MS YU YUN CHI $2,470
  console.log('\n--- Missing Transaction ---');
  console.log('Bank: 18-Aug-25 | MS YU YUN CHI | $2,470 | FPS Deposit');
  console.log('');
  console.log('This $2,470 is MISSING from Intranet!');
  console.log('Need to add this income record.');
})();
