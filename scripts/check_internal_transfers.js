const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 搵所有內部轉帳記錄
  const { data, error } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, income_category, expense_category, payment_method')
    .or('income_category.eq.內部轉帳,expense_category.eq.內部轉帳')
    .order('transaction_date', { ascending: true });
  
  if (error) { console.error(error); return; }
  
  console.log('=== 所有內部轉帳記錄 ===\n');
  
  if (data.length === 0) {
    console.log('暫時冇內部轉帳記錄！');
  } else {
    data.forEach(t => {
      console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item}`);
      console.log(`  Income: $${t.income_amount} (${t.income_category}) | Expense: $${t.expense_amount} (${t.expense_category})`);
      console.log(`  Payment: ${t.payment_method}`);
      console.log('---');
    });
  }
  
  console.log('\n=== 結論 ===');
  console.log('內部轉帳（儲蓄→支票）應該點入：');
  console.log('1. 儲蓄戶口：expense_category = 內部轉帳, expense_amount = 金額');
  console.log('2. 支票戶口：income_category = 內部轉帳, income_amount = 金額');
  console.log('如果一筆轉帳，需要入兩條 record（一出一入）');
  console.log('或者用一條 record，同時有 expense 同 income');
})();
