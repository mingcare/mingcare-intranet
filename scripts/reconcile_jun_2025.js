// June 2025 Bank Reconciliation Script
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Data - June 2025
const BANK_STATEMENT = {
  savings: {
    accountNumber: '002113176',
    openingBalance: 41078.53,
    closingBalance: 70815.21,
    totalCredit: 85056.68,
    totalDebit: 55320.00
  },
  current: {
    accountNumber: '002520252',
    openingBalance: 3420.54,
    closingBalance: 5187.04,
    totalCredit: 1840.00,
    totalDebit: 73.50
  }
};

async function reconcile() {
  console.log('='.repeat(70));
  console.log('June 2025 Bank Reconciliation');
  console.log('='.repeat(70));

  // Fetch all June 2025 transactions
  const { data: juneTxns, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('transaction_date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nTotal June 2025 transactions in DB: ${juneTxns.length}`);

  // Apply the same filter logic as the intranet
  // Savings: payment_method === '銀行轉賬' OR (支票 AND income > 0 AND income_category !== '內部轉帳')
  const savingsTxns = juneTxns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && t.income_amount > 0 && t.income_category !== '內部轉帳') return true;
    return false;
  });

  // Current: 支票 expense OR 內部轉帳 income
  const currentTxns = juneTxns.filter(t => {
    if (t.payment_method === '支票' && t.expense_amount > 0) return true;
    if (t.income_category === '內部轉帳' && t.income_amount > 0) return true;
    return false;
  });

  // Calculate totals
  const savingsIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const savingsExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const savingsNet = savingsIncome - savingsExpense;

  const currentIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const currentExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const currentNet = currentIncome - currentExpense;

  // Opening balances from May closing
  const savingsOpening = 41078.53;
  const currentOpening = 3420.54;

  const savingsClosing = savingsOpening + savingsNet;
  const currentClosing = currentOpening + currentNet;

  console.log('\n' + '='.repeat(70));
  console.log('SAVINGS ACCOUNT (儲蓄戶口) 002113176');
  console.log('='.repeat(70));
  console.log('\n--- Bank Statement ---');
  console.log(`Opening Balance: $${BANK_STATEMENT.savings.openingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Credit:    $${BANK_STATEMENT.savings.totalCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Debit:     $${BANK_STATEMENT.savings.totalDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Balance: $${BANK_STATEMENT.savings.closingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  console.log('\n--- Intranet (Filtered) ---');
  console.log(`Transactions: ${savingsTxns.length}`);
  console.log(`Opening Balance: $${savingsOpening.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Income:    $${savingsIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Expense:   $${savingsExpense.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Balance: $${savingsClosing.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  console.log('\n--- Comparison ---');
  const savingsIncomeDiff = savingsIncome - BANK_STATEMENT.savings.totalCredit;
  const savingsExpenseDiff = savingsExpense - BANK_STATEMENT.savings.totalDebit;
  const savingsClosingDiff = savingsClosing - BANK_STATEMENT.savings.closingBalance;

  console.log(`Income Diff:  ${savingsIncomeDiff >= 0 ? '+' : ''}$${savingsIncomeDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Expense Diff: ${savingsExpenseDiff >= 0 ? '+' : ''}$${savingsExpenseDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Diff: ${savingsClosingDiff >= 0 ? '+' : ''}$${savingsClosingDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  if (Math.abs(savingsClosingDiff) < 0.01) {
    console.log('\n✅ SAVINGS CLOSING BALANCE MATCHES!');
  } else {
    console.log('\n❌ SAVINGS CLOSING BALANCE MISMATCH!');
  }

  console.log('\n' + '='.repeat(70));
  console.log('CURRENT ACCOUNT (支票戶口) 002520252');
  console.log('='.repeat(70));
  console.log('\n--- Bank Statement ---');
  console.log(`Opening Balance: $${BANK_STATEMENT.current.openingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Credit:    $${BANK_STATEMENT.current.totalCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Debit:     $${BANK_STATEMENT.current.totalDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Balance: $${BANK_STATEMENT.current.closingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  console.log('\n--- Intranet (Filtered) ---');
  console.log(`Transactions: ${currentTxns.length}`);
  console.log(`Opening Balance: $${currentOpening.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Income:    $${currentIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Total Expense:   $${currentExpense.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Balance: $${currentClosing.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  console.log('\n--- Comparison ---');
  const currentIncomeDiff = currentIncome - BANK_STATEMENT.current.totalCredit;
  const currentExpenseDiff = currentExpense - BANK_STATEMENT.current.totalDebit;
  const currentClosingDiff = currentClosing - BANK_STATEMENT.current.closingBalance;

  console.log(`Income Diff:  ${currentIncomeDiff >= 0 ? '+' : ''}$${currentIncomeDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Expense Diff: ${currentExpenseDiff >= 0 ? '+' : ''}$${currentExpenseDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Closing Diff: ${currentClosingDiff >= 0 ? '+' : ''}$${currentClosingDiff.toLocaleString('en-US', {minimumFractionDigits: 2})}`);

  if (Math.abs(currentClosingDiff) < 0.01) {
    console.log('\n✅ CURRENT CLOSING BALANCE MATCHES!');
  } else {
    console.log('\n❌ CURRENT CLOSING BALANCE MISMATCH!');
  }

  // Show transaction details if there's a mismatch
  if (Math.abs(savingsClosingDiff) >= 0.01) {
    console.log('\n' + '='.repeat(70));
    console.log('SAVINGS TRANSACTIONS DETAIL');
    console.log('='.repeat(70));
    savingsTxns.forEach(t => {
      const inc = t.income_amount ? `+$${t.income_amount.toLocaleString()}` : '';
      const exp = t.expense_amount ? `-$${t.expense_amount.toLocaleString()}` : '';
      console.log(`${t.transaction_date} | ${t.journal_number} | ${t.payment_method} | ${t.transaction_item?.substring(0, 30)} | ${inc}${exp}`);
    });
  }

  if (Math.abs(currentClosingDiff) >= 0.01) {
    console.log('\n' + '='.repeat(70));
    console.log('CURRENT TRANSACTIONS DETAIL');
    console.log('='.repeat(70));
    currentTxns.forEach(t => {
      const inc = t.income_amount ? `+$${t.income_amount.toLocaleString()}` : '';
      const exp = t.expense_amount ? `-$${t.expense_amount.toLocaleString()}` : '';
      console.log(`${t.transaction_date} | ${t.journal_number} | ${t.payment_method} | ${t.transaction_item?.substring(0, 30)} | ${inc}${exp}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  const savingsMatch = Math.abs(savingsClosingDiff) < 0.01;
  const currentMatch = Math.abs(currentClosingDiff) < 0.01;
  console.log(`Savings Account: ${savingsMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
  console.log(`Current Account: ${currentMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
}

reconcile().catch(console.error);
