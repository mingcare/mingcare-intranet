const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// October 2025 Bank Statement
const BANK = {
  savings: { opening: 180669.99, closing: 43197.51, credit: 313467.79, debit: 450940.27 },
  current: { opening: 1492.04, closing: 3332.04, credit: 74680.00, debit: 72840.00 }
};

(async () => {
  // Get all October 2025 transactions
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .order('transaction_date');
  
  console.log('=== October 2025 Reconciliation ===\n');
  console.log('Total transactions:', txns.length);
  
  // Check deduct_from_petty_cash distribution for 銀行轉賬
  const bankTransfer = txns.filter(t => t.payment_method === '銀行轉賬');
  const deductTrue = bankTransfer.filter(t => t.deduct_from_petty_cash === true).length;
  const deductFalse = bankTransfer.filter(t => t.deduct_from_petty_cash === false).length;
  const deductNull = bankTransfer.filter(t => t.deduct_from_petty_cash === null).length;
  
  console.log('\n銀行轉賬 deduct_from_petty_cash:');
  console.log('  true:', deductTrue, '(問題! 唔會出現喺儲蓄戶口)');
  console.log('  false:', deductFalse);
  console.log('  null:', deductNull);
  
  // Fix if needed
  if (deductTrue > 0) {
    console.log('\n⚠️  需要修正', deductTrue, '筆記錄...');
    const { data: fixed } = await supabase.from('financial_transactions')
      .update({ deduct_from_petty_cash: false })
      .gte('transaction_date', '2025-10-01')
      .lte('transaction_date', '2025-10-31')
      .eq('payment_method', '銀行轉賬')
      .eq('deduct_from_petty_cash', true)
      .select('journal_number');
    console.log('✅ Fixed', fixed.length, 'records');
  }
  
  // Re-query after fix
  const { data: txns2 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .order('transaction_date');
  
  // === SAVINGS ACCOUNT ===
  // Filter: payment_method='銀行轉賬' AND deduct_from_petty_cash=false
  const savingsTxns = txns2.filter(t => 
    t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash === false
  );
  
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n=== 儲蓄戶口 ===');
  console.log('Opening:', BANK.savings.opening);
  console.log('Income:', savingsInc, '(Bank:', BANK.savings.credit + ')');
  console.log('Expense:', savingsExp, '(Bank:', BANK.savings.debit + ')');
  console.log('Intranet Closing:', savingsClosing.toFixed(2));
  console.log('Bank Closing:', BANK.savings.closing);
  console.log('Difference:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // === CURRENT ACCOUNT ===
  // Filter: payment_method='支票' AND (expense>0 OR income_category='內部轉帳')
  const currentTxns = txns2.filter(t => 
    t.payment_method === '支票' && 
    ((t.expense_amount || 0) > 0 || t.income_category === '內部轉帳')
  );
  
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => {
    currentInc += t.income_amount || 0;
    currentExp += t.expense_amount || 0;
  });
  
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n=== 支票戶口 ===');
  console.log('Opening:', BANK.current.opening);
  console.log('Income:', currentInc, '(Bank:', BANK.current.credit + ')');
  console.log('Expense:', currentExp, '(Bank:', BANK.current.debit + ')');
  console.log('Intranet Closing:', currentClosing.toFixed(2));
  console.log('Bank Closing:', BANK.current.closing);
  console.log('Difference:', (BANK.current.closing - currentClosing).toFixed(2));
  
  // Check if internal transfers exist
  const internalTransfers = txns2.filter(t => 
    t.expense_category === '內部轉帳' || t.income_category === '內部轉帳'
  );
  console.log('\n=== 內部轉帳記錄 ===');
  console.log('Count:', internalTransfers.length);
  internalTransfers.forEach(t => {
    console.log(' ', t.transaction_date, t.journal_number, 
      t.income_amount ? '+$' + t.income_amount : '-$' + t.expense_amount,
      t.payment_method);
  });
})();
