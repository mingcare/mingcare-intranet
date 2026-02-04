const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Data - December 2025
const BANK = {
  savings: { opening: 14923.59, closing: 161604.07, credit: 500252.68, debit: 353572.20 },
  current: { opening: 20987.04, closing: 1757.04, credit: 68449, debit: 87679 }
};

(async () => {
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .order('transaction_date');

  // Filter out petty cash transactions
  const nonPetty = txns.filter(t => t.deduct_from_petty_cash !== true);

  // Savings filter (from BANK-RECONCILIATION-GUIDE.txt)
  const savingsTxns = nonPetty.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  // Current filter
  const currentTxns = nonPetty.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    if (t.payment_method === '支票戶口轉帳') return true;  // New payment method
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

  console.log('=== DECEMBER 2025 RECONCILIATION ===\n');
  
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

  // List savings income
  console.log('\n\n=== 儲蓄戶口 INCOME 明細 ===');
  const sIncome = savingsTxns.filter(t => (t.income_amount || 0) > 0);
  sIncome.forEach(t => {
    console.log(t.transaction_date, t.journal_number?.padEnd(18) || '', ('$'+parseFloat(t.income_amount).toFixed(2)).padStart(12), t.transaction_item?.substring(0,40));
  });
  console.log('TOTAL: $' + savingsIncome.toFixed(2));

  // List savings expense
  console.log('\n\n=== 儲蓄戶口 EXPENSE 明細 ===');
  const sExpense = savingsTxns.filter(t => (t.expense_amount || 0) > 0);
  sExpense.forEach(t => {
    console.log(t.transaction_date, t.journal_number?.padEnd(18) || '', ('$'+parseFloat(t.expense_amount).toFixed(2)).padStart(12), t.transaction_item?.substring(0,40));
  });
  console.log('TOTAL: $' + savingsExpense.toFixed(2));
})();
