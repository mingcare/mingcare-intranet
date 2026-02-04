const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 所有1月份記錄
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31');
  
  // 儲蓄戶口收入 = 銀行轉賬 或 支票，且不是 petty cash
  let savingsIncome = 0;
  let savingsExpense = 0;
  
  data?.forEach(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBank = t.payment_method === '銀行轉賬';
    const isCheque = t.payment_method === '支票';
    
    // 收入: 銀行轉賬或支票，不是 petty cash
    if ((isBank || isCheque) && !isPetty && t.income_amount > 0) {
      savingsIncome += t.income_amount;
    }
    
    // 支出: 只有銀行轉賬，不是 petty cash
    if (isBank && !isPetty && t.expense_amount > 0) {
      savingsExpense += t.expense_amount;
    }
  });
  
  const opening = 161604.07;
  const closing = opening + savingsIncome - savingsExpense;
  
  console.log('=== 1月份儲蓄戶口對帳 ===\n');
  console.log('Intranet 數據:');
  console.log('  收入 (銀行轉賬+支票): $' + savingsIncome.toLocaleString());
  console.log('  支出 (銀行轉賬):      $' + savingsExpense.toLocaleString());
  console.log('');
  console.log('銀行帳單:');
  console.log('  收入: $776,562.18');
  console.log('  支出: $400,205.17');
  console.log('');
  console.log('差異:');
  console.log('  收入差: $' + (776562.18 - savingsIncome).toFixed(2));
  console.log('  支出差: $' + (400205.17 - savingsExpense).toFixed(2));
  console.log('');
  console.log('結餘計算:');
  console.log('  $' + opening.toFixed(2) + ' + $' + savingsIncome.toFixed(2) + ' - $' + savingsExpense.toFixed(2) + ' = $' + closing.toFixed(2));
  console.log('  銀行結餘: $537,961.08');
  
  process.exit(0);
})();
