const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

const BANK = {
  savings: { opening: 43197.51, closing: 14923.59, credit: 385700.29, debit: 413974.21 },
  current: { opening: 3332.04, closing: 20987.04, credit: 78268.00, debit: 60613.00 }
};

(async () => {
  console.log('=== November 2025 Reconciliation ===\n');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30')
    .order('transaction_date');
  
  console.log('Total transactions:', txns.length);
  
  // Check deduct_from_petty_cash for 銀行轉賬
  const bankTransfer = txns.filter(t => t.payment_method === '銀行轉賬');
  const deductTrue = bankTransfer.filter(t => t.deduct_from_petty_cash === true).length;
  console.log('\n銀行轉賬 with deduct=true:', deductTrue, '(need fix)');
  
  // Fix if needed
  if (deductTrue > 0) {
    const { data: fixed } = await supabase.from('financial_transactions')
      .update({ deduct_from_petty_cash: false })
      .gte('transaction_date', '2025-11-01')
      .lte('transaction_date', '2025-11-30')
      .eq('payment_method', '銀行轉賬')
      .eq('deduct_from_petty_cash', true)
      .select('journal_number');
    console.log('✅ Fixed', fixed.length, 'records');
  }
  
  // Re-query
  const { data: txns2 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  // === SAVINGS ===
  const savingsTxns = txns2.filter(t => 
    t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true
  );
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Income:', savingsInc, '(Bank:', BANK.savings.credit, ')');
  console.log('  Expense:', savingsExp, '(Bank:', BANK.savings.debit, ')');
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Diff:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // === CURRENT ===
  const currentTxns = txns2.filter(t => t.payment_method === '支票');
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => {
    currentInc += t.income_amount || 0;
    currentExp += t.expense_amount || 0;
  });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Income:', currentInc, '(Bank:', BANK.current.credit, ')');
  console.log('  Expense:', currentExp, '(Bank:', BANK.current.debit, ')');
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Diff:', (BANK.current.closing - currentClosing).toFixed(2));
  
  // Check internal transfers
  const it = txns2.filter(t => t.expense_category === '內部轉帳' || t.income_category === '內部轉帳');
  console.log('\n=== 內部轉帳記錄:', it.length, '===');
  it.forEach(t => {
    console.log(' ', t.transaction_date, t.journal_number, 
      t.income_amount ? '+$' + t.income_amount : '-$' + t.expense_amount, t.payment_method);
  });
})();
