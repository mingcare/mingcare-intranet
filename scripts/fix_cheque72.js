const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 將 00000769 (支票#72) 的 transaction_date 改為 2025-06-01
  // 因為銀行結單5月份冇呢張支票，應該係6月先兌現
  
  const { data, error } = await supabase.from('financial_transactions')
    .update({ transaction_date: '2025-06-01' })
    .eq('journal_number', '00000769')
    .select('journal_number, transaction_date, billing_month, transaction_item, expense_amount');
  
  if (error) { console.error(error); return; }
  
  console.log('✅ 已更新支票#72嘅交易日期:');
  data.forEach(r => {
    console.log(`  ${r.journal_number}: ${r.transaction_date} (${r.billing_month})`);
    console.log(`  ${r.transaction_item}: $${r.expense_amount}`);
  });
  
  console.log('\n呢筆會計入6月份支票戶口，唔再影響5月份餘額');
  
  // 驗證
  console.log('\n=== 驗證5月份支票戶口 ===');
  
  const { data: mayRecords } = await supabase.from('financial_transactions')
    .select('journal_number, income_amount, expense_amount')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '支票')
    .eq('is_deleted', false);
  
  let income = 0, expense = 0;
  mayRecords.forEach(r => {
    income += Number(r.income_amount) || 0;
    expense += Number(r.expense_amount) || 0;
  });
  
  const opening = 3040.54;
  const closing = opening + income - expense;
  
  console.log(`期初: $${opening}`);
  console.log(`收入: $${income}`);
  console.log(`支出: $${expense}`);
  console.log(`期末: $${closing.toFixed(2)}`);
  console.log(`銀行結單期末: $3,420.54`);
  console.log(`差異: $${(closing - 3420.54).toFixed(2)}`);
})();
