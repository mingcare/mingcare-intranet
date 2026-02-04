const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 計算從系統開始到 2025-12-31 的累計
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount, payment_method, deduct_from_petty_cash')
    .lte('transaction_date', '2025-12-31')
    .eq('is_deleted', false);
  
  const OPENING = 82755.59; // 系統開戶餘額
  let income = 0, expense = 0;
  
  data?.forEach(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBankOrCheque = t.payment_method === '銀行轉賬' || t.payment_method === '支票';
    const isBank = t.payment_method === '銀行轉賬';
    
    if (isBankOrCheque && !isPetty && t.income_amount > 0) income += t.income_amount;
    if (isBank && !isPetty && t.expense_amount > 0) expense += t.expense_amount;
  });
  
  const closing = OPENING + income - expense;
  
  console.log('=== 計算到 2025-12-31 的累計 ===');
  console.log('系統開戶餘額: $' + OPENING.toFixed(2));
  console.log('累計收入: $' + income.toFixed(2));
  console.log('累計支出: $' + expense.toFixed(2));
  console.log('計算結餘: $' + closing.toFixed(2));
  console.log('');
  console.log('銀行 2026-01-01 Opening: $161,604.07');
  console.log('差額: $' + (161604.07 - closing).toFixed(2));
  
  process.exit(0);
})();
