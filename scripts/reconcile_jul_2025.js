const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// ====== BANK STATEMENT DATA (extracted from PDF) ======
// Savings: bank statement/002113176/002113176_..._072025.pdf
// Current: bank statement/002520252/002520252_..._072025.pdf

const BANK = {
  savings: {
    opening: 70815.21,
    closing: 132221.77,
    credit: 275653.83,
    debit: 214247.27
  },
  current: {
    opening: 5187.04,
    closing: 18147.04,
    credit: 22255.00,  // 1筆內部轉帳
    debit: 9295.00,    // 6筆支票提取
    transactions: [
      { date: '04-Jul-25', type: 'credit', amount: 22255, desc: 'CR EBICT50704160940 內部轉帳' },
      { date: '08-Jul-25', type: 'debit', amount: 220, desc: '000074 支票提取' },
      { date: '08-Jul-25', type: 'debit', amount: 1870, desc: '000038 支票提取' },
      { date: '09-Jul-25', type: 'debit', amount: 5025, desc: '000034 支票提取' },
      { date: '09-Jul-25', type: 'debit', amount: 1600, desc: '000033 支票提取' },
      { date: '15-Jul-25', type: 'debit', amount: 360, desc: '000036 支票提取' },
      { date: '19-Jul-25', type: 'debit', amount: 220, desc: '000040 支票提取' },
    ]
  }
};

const MONTH_START = '2025-07-01';
const MONTH_END = '2025-07-31';

(async () => {
  console.log('='.repeat(80));
  console.log('July 2025 Bank Reconciliation');
  console.log('='.repeat(80));

  // Get all July 2025 transactions
  const { data: txns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', MONTH_START)
    .lte('transaction_date', MONTH_END)
    .order('transaction_date');

  if (error) { console.error(error); return; }

  console.log('\nTotal transactions in July 2025:', txns.length);

  // ====== SAVINGS ACCOUNT ======
  // Filter: payment_method === '銀行轉賬' OR (支票 AND income > 0 AND !expense AND income_category !== '內部轉帳')
  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const savingsIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const savingsExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const savingsClosing = BANK.savings.opening + savingsIncome - savingsExpense;

  console.log('\n【儲蓄戶口 Savings Account】');
  console.log('Transactions:', savingsTxns.length);
  console.log('Bank Statement:  Opening $' + BANK.savings.opening + ' | Credit $' + BANK.savings.credit + ' | Debit $' + BANK.savings.debit + ' | Closing $' + BANK.savings.closing);
  console.log('Intranet:        Opening $' + BANK.savings.opening + ' | Income $' + savingsIncome.toFixed(2) + ' | Expense $' + savingsExpense.toFixed(2) + ' | Closing $' + savingsClosing.toFixed(2));
  
  if (Math.abs(savingsClosing - BANK.savings.closing) < 0.01) {
    console.log('✅ Savings MATCH!');
  } else {
    console.log('❌ Savings MISMATCH! Difference: $' + (savingsClosing - BANK.savings.closing).toFixed(2));
  }

  // ====== CURRENT ACCOUNT ======
  // Filter: (支票 AND expense > 0) OR (支票 AND income > 0 AND income_category === '內部轉帳')
  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const currentIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const currentExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const currentClosing = BANK.current.opening + currentIncome - currentExpense;

  console.log('\n【支票戶口 Current Account】');
  console.log('Transactions:', currentTxns.length);
  console.log('Bank Statement:  Opening $' + BANK.current.opening + ' | Credit $' + BANK.current.credit + ' | Debit $' + BANK.current.debit + ' | Closing $' + BANK.current.closing);
  console.log('Intranet:        Opening $' + BANK.current.opening + ' | Income $' + currentIncome.toFixed(2) + ' | Expense $' + currentExpense.toFixed(2) + ' | Closing $' + currentClosing.toFixed(2));

  if (Math.abs(currentClosing - BANK.current.closing) < 0.01) {
    console.log('✅ Current MATCH!');
  } else {
    console.log('❌ Current MISMATCH! Difference: $' + (currentClosing - BANK.current.closing).toFixed(2));
    
    // Show Bank statement transactions
    console.log('\n--- Bank Statement Transactions ---');
    BANK.current.transactions.forEach(t => {
      const amt = t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`;
      console.log(`${t.date} | ${amt.padStart(10)} | ${t.desc}`);
    });
    
    // Show Intranet transactions
    console.log('\n--- Intranet Transactions ---');
    currentTxns.forEach(t => {
      const inc = t.income_amount || 0;
      const exp = t.expense_amount || 0;
      console.log(`${t.transaction_date} | ${t.journal_number} | Inc: ${inc} | Exp: ${exp} | ${(t.transaction_item || '').substring(0,35)}`);
    });

    // Analysis
    console.log('\n--- Analysis ---');
    if (currentIncome < BANK.current.credit) {
      console.log('⚠️ Missing internal transfer income: Need to add $' + (BANK.current.credit - currentIncome));
    }
    if (currentExpense !== BANK.current.debit) {
      console.log('⚠️ Expense difference: Intranet $' + currentExpense + ' vs Bank $' + BANK.current.debit);
    }
  }

  console.log('\n' + '='.repeat(80));
})();
