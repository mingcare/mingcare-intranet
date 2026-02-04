const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('payment_method', '銀行轉賬')
    .neq('deduct_from_petty_cash', true);
  
  let income = 0, expense = 0;
  data?.forEach(t => {
    income += t.income_amount || 0;
    expense += t.expense_amount || 0;
  });
  
  const bankOpening = 161604.07;
  const bankIncome = 776562.18;
  const bankExpense = 400205.17;
  const bankClosing = 537961.08;
  
  const calcClosing = bankOpening + income - expense;
  
  console.log('=== 1月份儲蓄戶口對帳 ===\n');
  console.log('Opening Balance: $' + bankOpening.toFixed(2));
  console.log('');
  console.log('Income:   Intranet $' + income.toFixed(2) + ' vs Bank $' + bankIncome.toFixed(2) + ' → Diff: $' + (bankIncome - income).toFixed(2));
  console.log('Expense:  Intranet $' + expense.toFixed(2) + ' vs Bank $' + bankExpense.toFixed(2) + ' → Diff: $' + (bankExpense - expense).toFixed(2));
  console.log('');
  console.log('Closing Balance:');
  console.log('  計算: $' + bankOpening.toFixed(2) + ' + $' + income.toFixed(2) + ' - $' + expense.toFixed(2) + ' = $' + calcClosing.toFixed(2));
  console.log('  銀行: $' + bankClosing.toFixed(2));
  console.log('  差異: $' + (bankClosing - calcClosing).toFixed(2));
  console.log('');
  
  if (Math.abs(bankClosing - calcClosing) < 0.01) {
    console.log('✅ Balance 對帳成功!');
  } else {
    console.log('❌ Balance 不符!');
  }
  
  process.exit(0);
})();
