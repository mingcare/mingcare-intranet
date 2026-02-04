const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-02-01')
    .lte('transaction_date', '2026-02-04')
    .eq('payment_method', '銀行轉賬')
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  console.log('=== Feb 1-4 儲蓄戶口記錄 ===\n');
  let income = 0, expense = 0;
  
  console.log('【收入】');
  data?.filter(t => t.income_amount > 0).forEach(t => {
    income += t.income_amount;
    console.log(`  ${t.transaction_date} $${t.income_amount.toLocaleString()} ${t.transaction_item}`);
  });
  console.log(`  小計: $${income.toLocaleString()}`);
  
  console.log('\n【支出】');
  data?.filter(t => t.expense_amount > 0).forEach(t => {
    expense += t.expense_amount;
    console.log(`  ${t.transaction_date} $${t.expense_amount.toLocaleString()} ${t.transaction_item}`);
  });
  console.log(`  小計: $${expense.toLocaleString()}`);
  
  const opening = 537961.08;
  const closing = opening + income - expense;
  
  console.log('\n=== 對帳結果 ===');
  console.log(`上月結餘: $${opening.toLocaleString()}`);
  console.log(`+ 收入: $${income.toLocaleString()} (銀行: $3,300)`);
  console.log(`- 支出: $${expense.toLocaleString()} (銀行: $69,170)`);
  console.log(`= 結餘: $${closing.toLocaleString()} (銀行: $472,091.08)`);
  console.log('');
  console.log(`收入差異: $${(3300 - income).toLocaleString()}`);
  console.log(`支出差異: $${(69170 - expense).toLocaleString()}`);
  
  process.exit(0);
})();
