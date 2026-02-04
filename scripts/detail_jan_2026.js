const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  const { data: txns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Filter for savings account transactions
  const savings = txns.filter(t => {
    if (t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true) return true;
    if (t.payment_method === '支票' && t.income_amount > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  console.log('=== 儲蓄戶口 INCOME (Intranet) ===');
  let totalIn = 0;
  const incomeList = savings.filter(t => t.income_amount > 0).sort((a,b) => a.income_amount - b.income_amount);
  incomeList.forEach(t => {
    totalIn += t.income_amount;
    const item = t.transaction_item || '';
    console.log(`${t.transaction_date} | ${t.income_amount.toFixed(2).padStart(12)} | ${item.substring(0,40)}`);
  });
  console.log(`\nIntranet Income Total: $${totalIn.toFixed(2)}`);
  console.log(`Bank Credit Total: $776,562.18`);
  console.log(`Difference: $${(776562.18 - totalIn).toFixed(2)}\n`);

  console.log('=== 儲蓄戶口 EXPENSE (Intranet) ===');
  let totalOut = 0;
  const expenseList = savings.filter(t => t.expense_amount > 0).sort((a,b) => a.expense_amount - b.expense_amount);
  expenseList.forEach(t => {
    totalOut += t.expense_amount;
    const item = t.transaction_item || '';
    console.log(`${t.transaction_date} | ${t.expense_amount.toFixed(2).padStart(12)} | ${item.substring(0,40)}`);
  });
  console.log(`\nIntranet Expense Total: $${totalOut.toFixed(2)}`);
  console.log(`Bank Debit Total: $400,205.17`);
  console.log(`Difference: $${(400205.17 - totalOut).toFixed(2)}`);

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Income records: ${incomeList.length}`);
  console.log(`Expense records: ${expenseList.length}`);
})();
