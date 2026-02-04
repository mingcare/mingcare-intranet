const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 4月份支票戶口交易 (支票戶口 = 支票支出 + 內部轉帳收入)
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, income_category, expense_category')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('payment_method', '支票')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  let income = 0, expense = 0;
  console.log('=== 4月份支票戶口交易 ===');
  
  // 支票戶口邏輯：支票支出 + 內部轉帳收入
  const filtered = data.filter(r => {
    return (r.expense_amount > 0) || (r.income_amount > 0 && r.income_category === '內部轉帳');
  });
  
  filtered.forEach(r => {
    const inc = Number(r.income_amount) || 0;
    const exp = Number(r.expense_amount) || 0;
    income += inc;
    expense += exp;
    console.log(`${r.journal_number} | ${r.transaction_date} | Inc:$${inc} | Exp:$${exp} | ${r.transaction_item.substring(0,35)}`);
  });
  
  console.log(`\n4月份總收入 (內部轉帳): $${income}`);
  console.log(`4月份總支出 (支票支出): $${expense}`);
  console.log(`4月份淨變動: $${income - expense}`);
  console.log(`\n4月期初: $1,086.54`);
  console.log(`4月期末 (計算): $${(1086.54 + income - expense).toFixed(2)}`);
  console.log(`銀行5月期初: $3,040.54`);
  console.log(`差異: $${(1086.54 + income - expense - 3040.54).toFixed(2)}`);
})();
