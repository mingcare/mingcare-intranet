const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 銀行轉賬 + 支票 收入 (都會存入儲蓄戶口)
  const { data: income } = await supabase.from('financial_transactions')
    .select('income_amount, payment_method')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .in('payment_method', ['銀行轉賬', '支票'])
    .gt('income_amount', 0)
    .neq('deduct_from_petty_cash', true);
  
  // 銀行轉賬支出
  const { data: expense } = await supabase.from('financial_transactions')
    .select('expense_amount')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('payment_method', '銀行轉賬')
    .gt('expense_amount', 0)
    .neq('deduct_from_petty_cash', true);
  
  let bankIncome = 0, chequeIncome = 0, totalExpense = 0;
  
  income?.forEach(t => {
    if (t.payment_method === '銀行轉賬') {
      bankIncome += t.income_amount;
    } else {
      chequeIncome += t.income_amount;
    }
  });
  
  expense?.forEach(t => {
    totalExpense += t.expense_amount;
  });
  
  const totalIncome = bankIncome + chequeIncome;
  const opening = 161604.07;
  const closing = opening + totalIncome - totalExpense;
  
  console.log('=== 1月份儲蓄戶口對帳 (含支票) ===\n');
  console.log('收入:');
  console.log('  銀行轉賬: $' + bankIncome.toLocaleString());
  console.log('  支票存入: $' + chequeIncome.toLocaleString());
  console.log('  總收入:   $' + totalIncome.toLocaleString());
  console.log('  銀行帳單: $776,562.18');
  console.log('  差額:     $' + (776562.18 - totalIncome).toFixed(2));
  console.log('');
  console.log('支出:');
  console.log('  Intranet: $' + totalExpense.toLocaleString());
  console.log('  銀行帳單: $400,205.17');
  console.log('  差額:     $' + (400205.17 - totalExpense).toFixed(2));
  console.log('');
  console.log('結餘:');
  console.log('  Opening:  $' + opening.toLocaleString());
  console.log('  + Income: $' + totalIncome.toLocaleString());
  console.log('  - Expense: $' + totalExpense.toLocaleString());
  console.log('  = Closing: $' + closing.toLocaleString());
  console.log('  銀行結餘: $537,961.08');
  console.log('  差額:     $' + (537961.08 - closing).toFixed(2));
  
  process.exit(0);
})();
