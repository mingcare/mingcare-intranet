const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('income_amount', { ascending: false });
  
  console.log('=== 1月份所有儲蓄戶口記錄 ===\n');
  
  let totalIncome = 0, totalExpense = 0;
  
  console.log('【收入記錄】');
  data?.filter(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBankOrCheque = t.payment_method === '銀行轉賬' || t.payment_method === '支票';
    return isBankOrCheque && !isPetty && t.income_amount > 0;
  }).forEach(t => {
    totalIncome += t.income_amount;
    const type = t.payment_method === '支票' ? '[支票]' : '[FPS]';
    console.log(`${t.transaction_date} ${type.padEnd(6)} $${t.income_amount.toFixed(2).padStart(12)} ${t.transaction_item?.substring(0, 35) || ''}`);
  });
  console.log(`收入小計: $${totalIncome.toFixed(2)}`);
  
  console.log('\n【支出記錄】');
  data?.filter(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBank = t.payment_method === '銀行轉賬';
    return isBank && !isPetty && t.expense_amount > 0;
  }).forEach(t => {
    totalExpense += t.expense_amount;
    console.log(`${t.transaction_date}        $${t.expense_amount.toFixed(2).padStart(12)} ${t.transaction_item?.substring(0, 35) || ''}`);
  });
  console.log(`支出小計: $${totalExpense.toFixed(2)}`);
  
  console.log('\n=== 總結 ===');
  console.log('Opening: $161,604.07');
  console.log('Income:  $' + totalIncome.toFixed(2));
  console.log('Expense: $' + totalExpense.toFixed(2));
  console.log('Closing: $' + (161604.07 + totalIncome - totalExpense).toFixed(2));
  
  process.exit(0);
})();
