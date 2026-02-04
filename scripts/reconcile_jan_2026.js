const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Data - January 2026
const BANK = {
  savings: { opening: 161604.07, closing: 537961.08, credit: 776562.18, debit: 400205.17 },
  current: { opening: 1757.04, closing: 1757.04, credit: 0, debit: 0 }
};

(async () => {
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .order('transaction_date');

  // Filter out petty cash transactions
  const nonPetty = txns.filter(t => t.deduct_from_petty_cash !== true);

  // Savings filter
  const savingsTxns = nonPetty.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  // Current filter
  const currentTxns = nonPetty.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    if (t.payment_method === '支票戶口轉帳') return true;
    return false;
  });

  // Calculate Savings
  const savingsIncome = savingsTxns.filter(t => (t.income_amount || 0) > 0).reduce((sum, t) => sum + parseFloat(t.income_amount || 0), 0);
  const savingsExpense = savingsTxns.filter(t => (t.expense_amount || 0) > 0).reduce((sum, t) => sum + parseFloat(t.expense_amount || 0), 0);
  const savingsClosing = BANK.savings.opening + savingsIncome - savingsExpense;

  // Calculate Current
  const currentIncome = currentTxns.filter(t => (t.income_amount || 0) > 0).reduce((sum, t) => sum + parseFloat(t.income_amount || 0), 0);
  const currentExpense = currentTxns.filter(t => (t.expense_amount || 0) > 0).reduce((sum, t) => sum + parseFloat(t.expense_amount || 0), 0);
  const currentClosing = BANK.current.opening + currentIncome - currentExpense;

  console.log('=== JANUARY 2026 RECONCILIATION ===\n');
  
  console.log('🏦 儲蓄戶口 002113176:');
  console.log('   Opening:     $' + BANK.savings.opening.toFixed(2));
  console.log('   + Income:    $' + savingsIncome.toFixed(2) + ' (Bank: $' + BANK.savings.credit.toFixed(2) + ')');
  console.log('   - Expense:   $' + savingsExpense.toFixed(2) + ' (Bank: $' + BANK.savings.debit.toFixed(2) + ')');
  console.log('   = Closing:   $' + savingsClosing.toFixed(2) + ' (Bank: $' + BANK.savings.closing.toFixed(2) + ')');
  console.log('   Match:', Math.abs(savingsClosing - BANK.savings.closing) < 0.1 ? '✅' : '❌ Diff: $' + (savingsClosing - BANK.savings.closing).toFixed(2));

  console.log('\n📝 支票戶口 002520252:');
  console.log('   Opening:     $' + BANK.current.opening.toFixed(2));
  console.log('   + Income:    $' + currentIncome.toFixed(2) + ' (Bank: $' + BANK.current.credit.toFixed(2) + ')');
  console.log('   - Expense:   $' + currentExpense.toFixed(2) + ' (Bank: $' + BANK.current.debit.toFixed(2) + ')');
  console.log('   = Closing:   $' + currentClosing.toFixed(2) + ' (Bank: $' + BANK.current.closing.toFixed(2) + ')');
  console.log('   Match:', Math.abs(currentClosing - BANK.current.closing) < 0.1 ? '✅' : '❌ Diff: $' + (currentClosing - BANK.current.closing).toFixed(2));

  console.log('\n\n=== 儲蓄戶口 INCOME 明細 ===');
  console.log('Records:', savingsTxns.filter(t => (t.income_amount || 0) > 0).length);
  
  console.log('\n=== 儲蓄戶口 EXPENSE 明細 ===');
  console.log('Records:', savingsTxns.filter(t => (t.expense_amount || 0) > 0).length);
  
  // Check for deduct_from_petty_cash issues
  const pettyIssues = txns.filter(t => 
    t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash === true
  );
  if (pettyIssues.length > 0) {
    console.log('\n⚠️ WARNING: Found', pettyIssues.length, 'records with 銀行轉賬 but deduct_from_petty_cash=true');
    console.log('These need to be fixed!');
  }
})();
