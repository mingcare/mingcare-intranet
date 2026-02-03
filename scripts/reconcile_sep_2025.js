const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Data - September 2025
const BANK = {
  savings: { opening: 114671.46, closing: 180669.99, credit: 420898.53, debit: 354900.00 },
  current: { opening: 652.04, closing: 1492.04, credit: 61600, debit: 60760 }
};

(async () => {
  console.log('='.repeat(60));
  console.log('September 2025 Bank Reconciliation');
  console.log('='.repeat(60));

  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .order('transaction_date');

  console.log('\nTotal transactions in September 2025:', txns.length);

  // ==================== 🏦 儲蓄戶口 ====================
  console.log('\n' + '='.repeat(60));
  console.log('🏦 儲蓄戶口 (Savings Account 002113176)');
  console.log('='.repeat(60));

  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const sIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const sExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const sClosing = BANK.savings.opening + sIncome - sExpense;

  console.log('\nTransactions:', savingsTxns.length);
  console.log('Bank: Opening $' + BANK.savings.opening + ' | Credit $' + BANK.savings.credit + ' | Debit $' + BANK.savings.debit + ' | Closing $' + BANK.savings.closing);
  console.log('Intranet: Income $' + sIncome.toFixed(2) + ' | Expense $' + sExpense.toFixed(2) + ' | Closing $' + sClosing.toFixed(2));
  console.log('Difference: $' + (sClosing - BANK.savings.closing).toFixed(2));

  if (Math.abs(sClosing - BANK.savings.closing) < 1) {
    console.log('✅ 儲蓄戶口 MATCH!');
  } else {
    console.log('❌ 儲蓄戶口 MISMATCH');
    console.log('  Income diff: $' + (sIncome - (BANK.savings.closing - BANK.savings.opening + sExpense)).toFixed(2));
  }

  // ==================== 📝 支票戶口 ====================
  console.log('\n' + '='.repeat(60));
  console.log('📝 支票戶口 (Current Account 002520252)');
  console.log('='.repeat(60));

  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const cIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const cExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const cClosing = BANK.current.opening + cIncome - cExpense;

  console.log('\nTransactions:', currentTxns.length);
  console.log('Bank: Opening $' + BANK.current.opening + ' | Credit $' + BANK.current.credit + ' | Debit $' + BANK.current.debit + ' | Closing $' + BANK.current.closing);
  console.log('Intranet: Income $' + cIncome.toFixed(2) + ' | Expense $' + cExpense.toFixed(2) + ' | Closing $' + cClosing.toFixed(2));
  console.log('Difference: $' + (cClosing - BANK.current.closing).toFixed(2));

  if (Math.abs(cClosing - BANK.current.closing) < 1) {
    console.log('✅ 支票戶口 MATCH!');
  } else {
    console.log('❌ 支票戶口 MISMATCH');
    if (cIncome < BANK.current.credit) {
      console.log('  ⚠️ Missing internal transfer income: $' + (BANK.current.credit - cIncome));
    }
  }

  // Check internal transfers
  console.log('\n--- Internal Transfers ---');
  const itSavings = savingsTxns.filter(t => t.expense_category === '內部轉帳');
  const itCurrent = currentTxns.filter(t => t.income_category === '內部轉帳');
  console.log('Savings out:', itSavings.length, 'records, $' + itSavings.reduce((s,t) => s + (t.expense_amount||0), 0));
  console.log('Current in:', itCurrent.length, 'records, $' + itCurrent.reduce((s,t) => s + (t.income_amount||0), 0));
  console.log('Bank Current Credit: $' + BANK.current.credit);

  console.log('\n' + '='.repeat(60));
})();
