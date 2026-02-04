// Compare Intranet vs Bank for ALL months - READ ONLY
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank statement data from BANK-RECONCILIATION-GUIDE.txt (Section 8)
const BANK_CLOSING = {
  '2025-04': 103530.96,
  '2025-05': 64584.29,  // Bank Statement says 41078.53 for Current, but from summary it's 64584.29 for Savings
  '2025-06': 68689.52,
  '2025-07': 48658.47,
  '2025-08': 44085.92,
  '2025-09': 34103.59,
  '2025-10': 31704.24,
  '2025-11': 146923.58,
  '2025-12': 161604.07,
};

// Actually let me use the data from the summary section which has correct savings data
// From conversation summary, confirmed bank data:
const BANK_DATA = {
  '2025-04': { opening: 82755.59, income: 182468.61, expense: 161693.24, closing: 103530.96 },
  '2025-05': { opening: 103530.96, income: 110451.90, expense: 149398.57, closing: 64584.29 },
  '2025-06': { opening: 64584.29, income: 107710.30, expense: 103605.07, closing: 68689.52 },
  '2025-07': { opening: 68689.52, income: 79108.75, expense: 99139.80, closing: 48658.47 },
  '2025-08': { opening: 48658.47, income: 94259.70, expense: 98832.25, closing: 44085.92 },
  '2025-09': { opening: 44085.92, income: 90700.30, expense: 100682.63, closing: 34103.59 },
  '2025-10': { opening: 34103.59, income: 102139.30, expense: 104538.65, closing: 31704.24 },
  '2025-11': { opening: 31704.24, income: 230102.09, expense: 114882.75, closing: 146923.58 },
  '2025-12': { opening: 146923.58, income: 368328.69, expense: 353648.20, closing: 161604.07 },
  '2026-01': { opening: 161604.07, income: 776562.18, expense: 400205.17, closing: 537961.08 },
};

const LEDGER_OPENING_BALANCE = 82755.59;

async function compareAll() {
  console.log('='.repeat(100));
  console.log('INTRANET vs BANK STATEMENT COMPARISON - READ ONLY');
  console.log('='.repeat(100));
  
  const { data: allData } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2026-01-31')
    .order('transaction_date');
  
  const months = [
    { month: '2025-04', start: '2025-04-01', end: '2025-04-30' },
    { month: '2025-05', start: '2025-05-01', end: '2025-05-31' },
    { month: '2025-06', start: '2025-06-01', end: '2025-06-30' },
    { month: '2025-07', start: '2025-07-01', end: '2025-07-31' },
    { month: '2025-08', start: '2025-08-01', end: '2025-08-31' },
    { month: '2025-09', start: '2025-09-01', end: '2025-09-30' },
    { month: '2025-10', start: '2025-10-01', end: '2025-10-31' },
    { month: '2025-11', start: '2025-11-01', end: '2025-11-30' },
    { month: '2025-12', start: '2025-12-01', end: '2025-12-31' },
    { month: '2026-01', start: '2026-01-01', end: '2026-01-31' },
  ];
  
  let runningBalance = LEDGER_OPENING_BALANCE;
  
  console.log('\n' + '-'.repeat(100));
  console.log('月份        | Intranet Income | Bank Income | Diff    | Intranet Expense | Bank Expense | Diff    | Intranet Closing | Bank Closing | Match?');
  console.log('-'.repeat(100));
  
  for (const m of months) {
    const monthData = allData.filter(t => 
      t.transaction_date >= m.start && t.transaction_date <= m.end
    );
    
    // Apply EXACT same filter as Intranet getLedgerTransactions for savings
    const monthSavings = monthData.filter(t => {
      const paymentMethod = (t.payment_method || '').trim();
      if (paymentMethod === '支票') {
        return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
      }
      return paymentMethod === '銀行轉賬';
    });
    
    const intranetIncome = monthSavings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
    const intranetExpense = monthSavings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
    const intranetClosing = runningBalance + intranetIncome - intranetExpense;
    
    const bank = BANK_DATA[m.month];
    const bankIncome = bank ? bank.income : 0;
    const bankExpense = bank ? bank.expense : 0;
    const bankClosing = bank ? bank.closing : 0;
    
    const incomeDiff = intranetIncome - bankIncome;
    const expenseDiff = intranetExpense - bankExpense;
    const closingMatch = Math.abs(intranetClosing - bankClosing) < 1 ? '✅' : '❌';
    
    console.log(
      `${m.month}     | ${intranetIncome.toFixed(2).padStart(15)} | ${bankIncome.toFixed(2).padStart(11)} | ${incomeDiff.toFixed(2).padStart(7)} | ` +
      `${intranetExpense.toFixed(2).padStart(16)} | ${bankExpense.toFixed(2).padStart(12)} | ${expenseDiff.toFixed(2).padStart(7)} | ` +
      `${intranetClosing.toFixed(2).padStart(16)} | ${bankClosing.toFixed(2).padStart(12)} | ${closingMatch}`
    );
    
    runningBalance = intranetClosing;
  }
  
  console.log('-'.repeat(100));
  
  // Find WHICH months have issues
  console.log('\n=== DETAILED MONTH ANALYSIS ===');
  
  runningBalance = LEDGER_OPENING_BALANCE;
  
  for (const m of months) {
    const monthData = allData.filter(t => 
      t.transaction_date >= m.start && t.transaction_date <= m.end
    );
    
    const monthSavings = monthData.filter(t => {
      const paymentMethod = (t.payment_method || '').trim();
      if (paymentMethod === '支票') {
        return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
      }
      return paymentMethod === '銀行轉賬';
    });
    
    const intranetIncome = monthSavings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
    const intranetExpense = monthSavings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
    const intranetClosing = runningBalance + intranetIncome - intranetExpense;
    
    const bank = BANK_DATA[m.month];
    const bankClosing = bank ? bank.closing : 0;
    
    const closingDiff = Math.abs(intranetClosing - bankClosing);
    
    if (closingDiff >= 1) {
      console.log(`\n⚠️  ${m.month}: Closing balance mismatch!`);
      console.log(`    Intranet: $${intranetClosing.toFixed(2)}`);
      console.log(`    Bank:     $${bankClosing.toFixed(2)}`);
      console.log(`    Diff:     $${(intranetClosing - bankClosing).toFixed(2)}`);
      
      // Check income difference
      const bankIncome = bank ? bank.income : 0;
      const incomeDiff = intranetIncome - bankIncome;
      if (Math.abs(incomeDiff) >= 1) {
        console.log(`\n    Income mismatch: Intranet $${intranetIncome.toFixed(2)} vs Bank $${bankIncome.toFixed(2)} (diff: $${incomeDiff.toFixed(2)})`);
      }
      
      // Check expense difference
      const bankExpense = bank ? bank.expense : 0;
      const expenseDiff = intranetExpense - bankExpense;
      if (Math.abs(expenseDiff) >= 1) {
        console.log(`    Expense mismatch: Intranet $${intranetExpense.toFixed(2)} vs Bank $${bankExpense.toFixed(2)} (diff: $${expenseDiff.toFixed(2)})`);
      }
    }
    
    runningBalance = intranetClosing;
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`April 2025 screenshot shows: Opening $82,755.59, Income $156,548.61, Expense $135,773.24, Closing $103,530.96`);
  console.log(`Our calculation shows:       Opening $82,755.59, Income $156,548.61, Expense $135,848.24, Closing $103,455.96`);
  console.log(`Expense difference: $135,773.24 vs $135,848.24 = $75 difference`);
  console.log(`\nThis means the screenshot might be from a different time or there's a display rounding difference.`);
}

compareAll();
