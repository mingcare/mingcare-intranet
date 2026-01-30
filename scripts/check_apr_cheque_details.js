const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  // 查詢所有4月份支票交易
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, payment_method, income_category, expense_category')
    .eq('payment_method', '支票')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('4月份支票交易：');
  console.log('='.repeat(100));
  
  let totalChequeIncome = 0;
  let totalChequeExpense = 0;
  
  data.forEach(t => {
    const item = t.transaction_item.substring(0, 35).padEnd(35);
    console.log(`${t.journal_number} | ${t.transaction_date} | ${item} | 收入:${(t.income_amount || 0).toLocaleString().padStart(8)} | 支出:${(t.expense_amount || 0).toLocaleString().padStart(8)} | ${t.income_category || t.expense_category || '-'}`);
    totalChequeIncome += (t.income_amount || 0);
    totalChequeExpense += (t.expense_amount || 0);
  });
  
  console.log('='.repeat(100));
  console.log(`支票收入總計: $${totalChequeIncome.toLocaleString()}`);
  console.log(`支票支出總計: $${totalChequeExpense.toLocaleString()}`);
  console.log(`支票淨額: $${(totalChequeIncome - totalChequeExpense).toLocaleString()}`);
  
  console.log('\n\n--- 支票戶口計算 ---');
  console.log(`期初餘額: $1,086.54`);
  console.log(`內部轉帳收入: $13,470.00`);
  console.log(`支票支出: $${totalChequeExpense.toLocaleString()}`);
  console.log(`期末餘額: $${(1086.54 + 13470 - totalChequeExpense).toFixed(2)}`);
})();
