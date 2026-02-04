const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Check for interest
  const { data: interest } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .ilike('transaction_item', '%利息%');
  
  console.log('=== 12月利息 ===');
  if (interest?.length) {
    interest.forEach(r => console.log(r.journal_number, r.income_amount, r.transaction_item));
  } else {
    console.log('冇搵到！需要加 $9.98 利息');
  }
  
  // List all December savings income sorted by date
  console.log('\n=== 12月儲蓄戶口收入 (按日期) ===');
  const { data: all } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('income_amount', 0)
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  // Savings filter
  const savings = all.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });
  
  let total = 0;
  savings.forEach(r => {
    const amt = parseFloat(r.income_amount);
    total += amt;
    console.log(r.transaction_date, r.journal_number?.padEnd(18), ('$'+amt.toFixed(2)).padStart(12), r.transaction_item?.substring(0,35));
  });
  console.log('\nTotal Intranet:', total.toFixed(2));
  console.log('Total Bank:', 500252.68);
  console.log('Diff:', (500252.68 - total).toFixed(2));
})();
