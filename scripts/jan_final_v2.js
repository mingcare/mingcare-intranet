const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 所有 1 月記錄 (排除已刪除)
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount, payment_method, deduct_from_petty_cash')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('is_deleted', false);
  
  let income = 0, expense = 0;
  
  data?.forEach(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBankOrCheque = t.payment_method === '銀行轉賬' || t.payment_method === '支票';
    const isBank = t.payment_method === '銀行轉賬';
    
    // 收入: 銀行轉賬或支票，不是 petty cash
    if (isBankOrCheque && !isPetty && t.income_amount > 0) {
      income += t.income_amount;
    }
    
    // 支出: 只有銀行轉賬，不是 petty cash
    if (isBank && !isPetty && t.expense_amount > 0) {
      expense += t.expense_amount;
    }
  });
  
  const opening = 161604.07;
  const closing = opening + income - expense;
  
  console.log('=== 1月份儲蓄戶口對帳 (最終 - 排除已刪除) ===\n');
  console.log('              Intranet          銀行帳單        差異');
  console.log('-------------------------------------------------------');
  console.log('Opening:   $' + opening.toFixed(2).padStart(12) + '    $161,604.07     $0.00');
  console.log('Income:    $' + income.toFixed(2).padStart(12) + '    $776,562.18    $' + (income - 776562.18).toFixed(2));
  console.log('Expense:   $' + expense.toFixed(2).padStart(12) + '    $400,205.17    $' + (expense - 400205.17).toFixed(2));
  console.log('Closing:   $' + closing.toFixed(2).padStart(12) + '    $537,961.08    $' + (closing - 537961.08).toFixed(2));
  console.log('');
  
  if (Math.abs(closing - 537961.08) < 0.01) {
    console.log('✅ 1月份 Balance 對帳成功!');
  } else {
    console.log('❌ Balance 不符，差異: $' + (closing - 537961.08).toFixed(2));
  }
  
  process.exit(0);
})();
