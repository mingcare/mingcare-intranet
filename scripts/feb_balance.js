const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 2月1-4日記錄 (排除已刪除)
  const { data } = await supabase.from('financial_transactions')
    .select('transaction_date, income_amount, expense_amount, payment_method, deduct_from_petty_cash, transaction_item')
    .gte('transaction_date', '2026-02-01')
    .lte('transaction_date', '2026-02-04')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  let income = 0, expense = 0;
  
  console.log('=== 2月1-4日儲蓄戶口記錄 ===\n');
  
  console.log('【收入】');
  data?.filter(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBankOrCheque = t.payment_method === '銀行轉賬' || t.payment_method === '支票';
    return isBankOrCheque && !isPetty && t.income_amount > 0;
  }).forEach(t => {
    income += t.income_amount;
    console.log(`  ${t.transaction_date} $${t.income_amount.toLocaleString().padStart(10)} ${t.transaction_item?.substring(0, 40) || ''}`);
  });
  console.log(`  小計: $${income.toLocaleString()}`);
  
  console.log('\n【支出】');
  data?.filter(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const isBank = t.payment_method === '銀行轉賬';
    return isBank && !isPetty && t.expense_amount > 0;
  }).forEach(t => {
    expense += t.expense_amount;
    console.log(`  ${t.transaction_date} $${t.expense_amount.toLocaleString().padStart(10)} ${t.transaction_item?.substring(0, 40) || ''}`);
  });
  console.log(`  小計: $${expense.toLocaleString()}`);
  
  const opening = 537961.08;
  const closing = opening + income - expense;
  
  console.log('\n=== 對帳結果 ===');
  console.log('              Intranet          銀行帳單        差異');
  console.log('-------------------------------------------------------');
  console.log('Opening:   $' + opening.toFixed(2).padStart(12) + '    $537,961.08     $0.00');
  console.log('Income:    $' + income.toFixed(2).padStart(12) + '    $3,300.00      $' + (income - 3300).toFixed(2));
  console.log('Expense:   $' + expense.toFixed(2).padStart(12) + '    $69,170.00     $' + (expense - 69170).toFixed(2));
  console.log('Closing:   $' + closing.toFixed(2).padStart(12) + '    $472,091.08    $' + (closing - 472091.08).toFixed(2));
  
  process.exit(0);
})();
