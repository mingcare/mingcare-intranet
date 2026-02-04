const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 將 00000862 和 00000863 的 transaction_date 改為 2025-06-01
  const { data, error } = await supabase.from('financial_transactions')
    .update({ transaction_date: '2025-06-01' })
    .in('journal_number', ['00000862', '00000863'])
    .select('journal_number, transaction_date, billing_month, transaction_item');
  
  if (error) { console.error(error); return; }
  
  console.log('已更新交易日期:');
  data.forEach(r => {
    console.log(`  ${r.journal_number}: ${r.transaction_date} (${r.billing_month}) - ${r.transaction_item}`);
  });
  
  console.log('\n呢兩筆會計入6月份，唔再影響5月份餘額');
})();
