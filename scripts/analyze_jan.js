const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // All Jan bank records
  const { data: all } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount, deduct_from_petty_cash')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('payment_method', '銀行轉賬');
  
  let totalIncome = 0, totalExpense = 0;
  let bankIncome = 0, bankExpense = 0;
  
  all?.forEach(t => {
    totalIncome += t.income_amount || 0;
    totalExpense += t.expense_amount || 0;
    if (t.deduct_from_petty_cash !== true) {
      bankIncome += t.income_amount || 0;
      bankExpense += t.expense_amount || 0;
    }
  });
  
  console.log('=== 1月份銀行轉賬記錄分析 ===\n');
  console.log('全部銀行轉賬記錄:');
  console.log('  總收入: $' + totalIncome.toLocaleString());
  console.log('  總支出: $' + totalExpense.toLocaleString());
  console.log('');
  console.log('deduct_from_petty_cash != true (儲蓄戶口):');
  console.log('  收入: $' + bankIncome.toLocaleString());
  console.log('  支出: $' + bankExpense.toLocaleString());
  console.log('');
  console.log('deduct_from_petty_cash = true (Petty Cash):');
  console.log('  收入: $' + (totalIncome - bankIncome).toLocaleString());
  console.log('  支出: $' + (totalExpense - bankExpense).toLocaleString());
  console.log('');
  console.log('銀行帳單數據:');
  console.log('  收入: $776,562.18');
  console.log('  支出: $400,205.17');
  
  process.exit(0);
})();
