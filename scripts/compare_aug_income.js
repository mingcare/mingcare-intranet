const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== August 2025 Income Comparison ===\n');

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

  // Get all income by category
  console.log('--- Intranet Income by Category ---');
  const incByCat = {};
  savingsTxns.forEach(t => {
    if ((t.income_amount || 0) > 0) {
      const cat = t.income_category || 'N/A';
      incByCat[cat] = (incByCat[cat] || 0) + t.income_amount;
    }
  });
  Object.entries(incByCat).sort((a,b) => b[1] - a[1]).forEach(([cat, amt]) => {
    console.log('  ' + cat + ': $' + amt.toFixed(2));
  });

  const totalIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  console.log('\n  Total Intranet Income: $' + totalIncome.toFixed(2));
  console.log('  Bank Credit: $222,512.36');
  console.log('  Difference: $' + (222512.36 - totalIncome).toFixed(2));

  // Bank has $222,512.36 credit
  // REV adds $1,200 to credit (reversal of FPS deposit returns money)
  // So actual deposits = $222,512.36 - $1,200 = $221,312.36

  console.log('\n--- Adjusted for REV ---');
  console.log('  Bank Credit (raw): $222,512.36');
  console.log('  Less: 2x REV $600: $1,200');
  console.log('  Actual deposits: $221,312.36');
  console.log('  Intranet Income: $' + totalIncome.toFixed(2));
  console.log('  Difference: $' + (221312.36 - totalIncome).toFixed(2));

  // If diff is $2,470, then:
  // Intranet should have $221,312.36 income
  // But has $218,842.36
  // Missing income: $2,470

  console.log('\n--- Missing Income Analysis ---');
  console.log('  Expected: $221,312.36');
  console.log('  Actual: $' + totalIncome.toFixed(2));
  console.log('  Missing: $' + (221312.36 - totalIncome).toFixed(2));

  // Check Bank Interest
  console.log('\n--- Bank Interest ---');
  const interest = savingsTxns.filter(t => 
    (t.transaction_item || '').includes('利息') || 
    (t.income_category || '').includes('利息')
  );
  interest.forEach(t => {
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | $' + t.income_amount + ' | ' + t.transaction_item);
  });
  console.log('  Bank Interest from statement: $7.36');
})();
