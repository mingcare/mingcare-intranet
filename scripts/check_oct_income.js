const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Get October 2025 儲蓄戶口 income transactions
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, income_amount, expense_amount, transaction_item, income_category')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false)
    .gt('income_amount', 0)
    .order('income_amount', { ascending: false });
  
  console.log('=== October 2025 儲蓄戶口 Income (Top 20) ===\n');
  let total = 0;
  data.slice(0, 20).forEach(t => {
    total += t.income_amount;
    console.log(
      t.transaction_date,
      t.journal_number.padEnd(15),
      ('$' + t.income_amount).padStart(10),
      (t.income_category || '').substring(0, 15),
      (t.transaction_item || '').substring(0, 30)
    );
  });
  console.log('');
  console.log('Total Income (all):', data.reduce((s, t) => s + t.income_amount, 0));
  console.log('Bank Credit: 313,467.79');
  console.log('Difference:', data.reduce((s, t) => s + t.income_amount, 0) - 313467.79);
})();
