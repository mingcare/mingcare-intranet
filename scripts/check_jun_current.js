const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// ====== BANK STATEMENT DATA (extracted from PDF) ======
// File: bank statement/002520252/002520252_5304482_HKD_062025.pdf
// Account: 002520252 (Current Account)
// Period: 01-Jun-2025 to 30-Jun-2025

const BANK_STATEMENT = {
  opening: 3420.54,
  closing: 5187.04,
  transactions: [
    { date: '02-Jun-25', type: 'debit', amount: 3080.00, desc: 'CASH PAYMENT 000072 支票提取', balance: 340.54 },
    { date: '06-Jun-25', type: 'credit', amount: 21500.00, desc: 'CR EBICT50606108407 MINGCARE HOME (內部轉帳)', balance: 21840.54 },
    { date: '11-Jun-25', type: 'credit', amount: 1000.00, desc: 'CR EBICT50611116615 MINGCARE HOME (內部轉帳)', balance: 22840.54 },
    { date: '12-Jun-25', type: 'debit', amount: 488.50, desc: 'INWARD CLEARING 000030 支票提取', balance: 22352.04 },
    { date: '12-Jun-25', type: 'debit', amount: 400.00, desc: 'INWARD CLEARING 000031 支票提取', balance: 21952.04 },
    { date: '14-Jun-25', type: 'debit', amount: 2040.00, desc: 'CASH PAYMENT 000027 支票提取', balance: 19912.04 },
    { date: '16-Jun-25', type: 'debit', amount: 9465.00, desc: 'CASH PAYMENT 000029 支票提取', balance: 10447.04 },
    { date: '18-Jun-25', type: 'debit', amount: 5160.00, desc: 'CASH PAYMENT 000075 支票提取', balance: 5287.04 },
    { date: '27-Jun-25', type: 'debit', amount: 100.00, desc: 'CHARGES 費用 Cheque Book Issuance', balance: 5187.04 },
    { date: '27-Jun-25', type: 'credit', amount: 50000.00, desc: 'CR EBICT50627147485 MINGCARE HOME (內部轉帳)', balance: 55187.04 },
    { date: '27-Jun-25', type: 'debit', amount: 50000.00, desc: 'CASH PAYMENT 000032 支票提取', balance: 5187.04 },
  ],
  totalCredit: 72500.00,
  totalDebit: 70733.50
};

(async () => {
  // Get all June 2025 支票 transactions from Intranet DB
  const { data: txns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '支票')
    .order('transaction_date');

  if (error) { console.error(error); return; }

  console.log('='.repeat(80));
  console.log('June 2025 支票戶口 (Current Account) 對帳分析');
  console.log('='.repeat(80));

  console.log('\n【銀行月結單 Bank Statement】');
  console.log('File: bank statement/002520252/002520252_5304482_HKD_062025.pdf\n');
  console.log('Date       | Type   | Amount    | Balance   | Description');
  console.log('-'.repeat(80));
  console.log(`31-May-25  | OPEN   |           | ${BANK_STATEMENT.opening.toFixed(2).padStart(9)} | 承上結餘 Balance Brought Forward`);
  BANK_STATEMENT.transactions.forEach(t => {
    const amt = t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`;
    console.log(`${t.date}  | ${t.type.padEnd(6)} | ${amt.padStart(9)} | ${t.balance.toFixed(2).padStart(9)} | ${t.desc.substring(0,35)}`);
  });
  console.log('-'.repeat(80));
  console.log(`Total Credit: $${BANK_STATEMENT.totalCredit.toFixed(2)}`);
  console.log(`Total Debit:  $${BANK_STATEMENT.totalDebit.toFixed(2)}`);
  console.log(`Closing:      $${BANK_STATEMENT.closing.toFixed(2)}`);

  // Current Account filter (same as Intranet page.tsx)
  const currentTxns = txns.filter(t => {
    return (t.expense_amount || 0) > 0 || (t.income_amount > 0 && t.income_category === '內部轉帳');
  });

  let totalIncome = 0;
  let totalExpense = 0;

  console.log('\n\n【Intranet 支票戶口 View】');
  console.log('Filter: payment_method=支票 AND (expense>0 OR income_category=內部轉帳)\n');
  console.log('Date       | Journal   | Income   | Expense  | Item');
  console.log('-'.repeat(80));
  
  currentTxns.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    totalIncome += inc;
    totalExpense += exp;
    console.log(`${t.transaction_date} | ${t.journal_number.padEnd(9)} | ${String(inc).padStart(8)} | ${String(exp).padStart(8)} | ${(t.transaction_item || '').substring(0,35)}`);
  });
  console.log('-'.repeat(80));
  console.log(`Total Income:  $${totalIncome.toFixed(2)}`);
  console.log(`Total Expense: $${totalExpense.toFixed(2)}`);
  
  const opening = 3420.54;
  const intranetClosing = opening + totalIncome - totalExpense;
  console.log(`Closing:       $${intranetClosing.toFixed(2)}`);

  console.log('\n\n【對帳結果 Reconciliation Result】');
  console.log('='.repeat(80));
  console.log('                    Bank Statement    Intranet         Difference');
  console.log('-'.repeat(80));
  console.log(`Opening:            $${BANK_STATEMENT.opening.toFixed(2).padEnd(15)} $${opening.toFixed(2).padEnd(15)} $${(opening - BANK_STATEMENT.opening).toFixed(2)}`);
  console.log(`Credit/Income:      $${BANK_STATEMENT.totalCredit.toFixed(2).padEnd(15)} $${totalIncome.toFixed(2).padEnd(15)} $${(totalIncome - BANK_STATEMENT.totalCredit).toFixed(2)}`);
  console.log(`Debit/Expense:      $${BANK_STATEMENT.totalDebit.toFixed(2).padEnd(15)} $${totalExpense.toFixed(2).padEnd(15)} $${(totalExpense - BANK_STATEMENT.totalDebit).toFixed(2)}`);
  console.log(`Closing:            $${BANK_STATEMENT.closing.toFixed(2).padEnd(15)} $${intranetClosing.toFixed(2).padEnd(15)} $${(intranetClosing - BANK_STATEMENT.closing).toFixed(2)}`);
  console.log('='.repeat(80));

  if (Math.abs(intranetClosing - BANK_STATEMENT.closing) < 0.01) {
    console.log('\n✅ MATCH! Closing balances match.');
  } else {
    console.log('\n❌ MISMATCH! Closing balances do not match.');
    console.log('\n【問題分析】');
    console.log('1. Income 差異: Intranet 冇內部轉帳收入記錄');
    console.log('   Bank 有 3 筆內部轉帳入賬: $21,500 + $1,000 + $50,000 = $72,500');
    console.log('   但 Intranet 只記錄咗 Savings 轉出，冇記錄 Current 轉入');
    console.log('');
    console.log('2. Expense 差異: Intranet 錯誤計入非 Current Account 交易');
    console.log('   支票工資/商務餐應該係從 Petty Cash 或其他途徑出，唔係 Current Account');
  }
})();
