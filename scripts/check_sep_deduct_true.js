const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Get September 銀行轉賬 records with deduct_from_petty_cash = true
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  console.log('=== September 銀行轉賬 with deduct_from_petty_cash = TRUE ===');
  console.log('Records:', data.length);
  console.log('');
  
  let totalInc = 0, totalExp = 0;
  data.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    totalInc += inc;
    totalExp += exp;
    console.log(
      t.transaction_date,
      t.journal_number.padEnd(15),
      (inc ? '+$' + inc : '').padStart(10),
      (exp ? '-$' + exp : '').padStart(10),
      (t.expense_category || t.income_category || '').substring(0, 15),
      (t.transaction_item || '').substring(0, 30)
    );
  });
  
  console.log('');
  console.log('Total Income:', totalInc);
  console.log('Total Expense:', totalExp);
  
  // These are records that SHOULD be in Savings view but are NOT
  // because deduct_from_petty_cash = true means they are excluded
  console.log('');
  console.log('呢啲記錄 deduct_from_petty_cash = true，唔會出現喺儲蓄戶口 view');
  console.log('如果佢哋係真正嘅銀行轉賬入賬，應該改為 false');
})();
