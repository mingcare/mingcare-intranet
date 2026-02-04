const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== 5月份所有銀行轉賬記錄 ===\n');
  
  const { data: records } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, income_category, expense_category')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');
  
  let runningBalance = 103530.96; // Opening
  
  console.log('Date       | JN       | Income    | Expense   | Balance   | Description');
  console.log('-'.repeat(100));
  
  records.forEach(r => {
    const inc = Number(r.income_amount) || 0;
    const exp = Number(r.expense_amount) || 0;
    runningBalance += inc - exp;
    
    const incStr = inc > 0 ? `$${inc.toFixed(2)}`.padStart(9) : '-'.padStart(9);
    const expStr = exp > 0 ? `$${exp.toFixed(2)}`.padStart(9) : '-'.padStart(9);
    const balStr = `$${runningBalance.toFixed(2)}`.padStart(10);
    const desc = r.transaction_item.substring(0, 35);
    
    console.log(`${r.transaction_date} | ${r.journal_number} | ${incStr} | ${expStr} | ${balStr} | ${desc}`);
  });
  
  console.log('-'.repeat(100));
  console.log(`最終餘額: $${runningBalance.toFixed(2)}`);
  console.log(`銀行結單: $41,078.53`);
  console.log(`差異: $${(runningBalance - 41078.53).toFixed(2)}`);
})();
