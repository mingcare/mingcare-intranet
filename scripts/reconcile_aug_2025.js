const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// ====== BANK STATEMENT DATA (extracted from PDF) ======
// Savings: bank statement/002113176/..._082025.pdf
// Current: bank statement/002520252/..._082025.pdf

const BANK = {
  savings: {
    opening: 132221.77,
    closing: 114671.46,
    credit: 222512.36,
    debit: 240062.67
  },
  current: {
    opening: 18147.04,
    closing: 652.04,
    credit: 8490.00,  // 1筆內部轉帳
    debit: 25985.00,  // 包括跨月支票
    transactions: [
      { date: '06-Aug-25', type: 'credit', amount: 8490, desc: 'CR EBICT50806219630 內部轉帳' },
      { date: '11-Aug-25', type: 'debit', amount: 8490, desc: '000041 支票提取' },
      { date: '14-Aug-25', type: 'debit', amount: 4095, desc: '000026 支票提取 (Jul issued)' },
      { date: '14-Aug-25', type: 'debit', amount: 7560, desc: '000037 支票提取 (Jul issued)' },
      { date: '18-Aug-25', type: 'debit', amount: 5840, desc: '000035 支票提取 (Jul issued)' },
    ]
  }
};

// 跨月支票：July 開出，August 兌現
const crossMonthCheques = [
  { cheque: '000026', amount: 4095, issuedMonth: '2025-07', cashedMonth: '2025-08' },
  { cheque: '000035', amount: 5840, issuedMonth: '2025-07', cashedMonth: '2025-08' },
  { cheque: '000037', amount: 7560, issuedMonth: '2025-07', cashedMonth: '2025-08' },
];

const MONTH_START = '2025-08-01';
const MONTH_END = '2025-08-31';

(async () => {
  console.log('='.repeat(80));
  console.log('August 2025 Bank Reconciliation');
  console.log('='.repeat(80));

  const { data: txns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', MONTH_START)
    .lte('transaction_date', MONTH_END)
    .order('transaction_date');

  if (error) { console.error(error); return; }

  console.log('\nTotal transactions in August 2025:', txns.length);

  // ====== SAVINGS ACCOUNT ======
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
  console.log('Bank Statement:  Opening $' + BANK.savings.opening + ' | Closing $' + BANK.savings.closing);
  console.log('Intranet:        Opening $' + BANK.savings.opening + ' | Income $' + savingsIncome.toFixed(2) + ' | Expense $' + savingsExpense.toFixed(2) + ' | Closing $' + savingsClosing.toFixed(2));
  
  const savingsDiff = savingsClosing - BANK.savings.closing;
  if (Math.abs(savingsDiff) < 0.01) {
    console.log('✅ Savings MATCH!');
  } else {
    console.log('❌ Savings MISMATCH! Difference: $' + savingsDiff.toFixed(2));
  }

  // ====== CURRENT ACCOUNT ======
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

  const currentDiff = currentClosing - BANK.current.closing;
  if (Math.abs(currentDiff) < 0.01) {
    console.log('✅ Current MATCH!');
  } else {
    console.log('❌ Current MISMATCH! Difference: $' + currentDiff.toFixed(2));
    
    // Show Bank statement
    console.log('\n--- Bank Statement ---');
    BANK.current.transactions.forEach(t => {
      const amt = t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`;
      console.log(`${t.date} | ${amt.padStart(10)} | ${t.desc}`);
    });
    
    // Show Intranet
    console.log('\n--- Intranet ---');
    currentTxns.forEach(t => {
      const inc = t.income_amount || 0;
      const exp = t.expense_amount || 0;
      console.log(`${t.transaction_date} | ${t.journal_number} | Inc: ${inc} | Exp: ${exp} | ${(t.transaction_item || '').substring(0,30)}`);
    });

    // Analysis
    console.log('\n--- Analysis ---');
    if (currentIncome < BANK.current.credit) {
      console.log('⚠️ Missing internal transfer income: Need $' + (BANK.current.credit - currentIncome));
    }
    
    // Check for cross-month cheques
    console.log('\n--- 跨月支票 (從 July) ---');
    crossMonthCheques.forEach(c => {
      console.log(`  Cheque ${c.cheque} $${c.amount} - 7月開出, 8月兌現`);
    });
    console.log('  Total: $' + crossMonthCheques.reduce((sum, c) => sum + c.amount, 0));
  }

  console.log('\n' + '='.repeat(80));
})();
