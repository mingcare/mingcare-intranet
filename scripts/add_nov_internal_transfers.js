const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// November 2025 Internal Transfers
// 3 x Forward (S→C): $60,143 + $4,855 + $13,270 = $78,268
// 2 x Reverse (C→S): $13,270 + $7,920 = $21,190

const transfers = [
  // IT-NOV-001: 06-Nov S→C $60,143
  { journal_number: 'IT-NOV-001', transaction_date: '2025-11-06', billing_month: '2025年11月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口', payment_method: '銀行轉賬',
    expense_amount: 60143, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51106386216', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-NOV-001-IN', transaction_date: '2025-11-06', billing_month: '2025年11月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口', payment_method: '支票',
    income_amount: 60143, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51106386216', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-NOV-002: 06-Nov S→C $4,855
  { journal_number: 'IT-NOV-002', transaction_date: '2025-11-06', billing_month: '2025年11月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口', payment_method: '銀行轉賬',
    expense_amount: 4855, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51106386439', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-NOV-002-IN', transaction_date: '2025-11-06', billing_month: '2025年11月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口', payment_method: '支票',
    income_amount: 4855, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51106386439', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-NOV-003: 20-Nov S→C $13,270
  { journal_number: 'IT-NOV-003', transaction_date: '2025-11-20', billing_month: '2025年11月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口', payment_method: '銀行轉賬',
    expense_amount: 13270, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51119408964', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-NOV-003-IN', transaction_date: '2025-11-20', billing_month: '2025年11月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口', payment_method: '支票',
    income_amount: 13270, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51119408964', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-NOV-004: 20-Nov C→S $13,270 (REVERSE)
  { journal_number: 'IT-NOV-004', transaction_date: '2025-11-20', billing_month: '2025年11月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)', payment_method: '支票',
    expense_amount: 13270, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBGPP51119327939', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-NOV-004-IN', transaction_date: '2025-11-20', billing_month: '2025年11月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)', payment_method: '銀行轉賬',
    income_amount: 13270, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBGPP51119327939', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-NOV-005: 24-Nov C→S $7,920 (REVERSE)
  { journal_number: 'IT-NOV-005', transaction_date: '2025-11-24', billing_month: '2025年11月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)', payment_method: '支票',
    expense_amount: 7920, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51124417192', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-NOV-005-IN', transaction_date: '2025-11-24', billing_month: '2025年11月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)', payment_method: '銀行轉賬',
    income_amount: 7920, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51124417192', fiscal_year: 2025, deduct_from_petty_cash: false }
];

(async () => {
  console.log('=== Adding November 2025 Internal Transfers ===\n');
  
  // Check existing
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', transfers.map(t => t.journal_number));
  
  const existingNums = existing.map(e => e.journal_number);
  const toInsert = transfers.filter(t => !existingNums.includes(t.journal_number));
  
  if (toInsert.length === 0) {
    console.log('All internal transfers already exist');
  } else {
    const { data, error } = await supabase.from('financial_transactions')
      .insert(toInsert)
      .select('journal_number, income_amount, expense_amount');
    
    if (error) { console.error(error); return; }
    console.log('✅ Added', data.length, 'records');
  }
  
  // Verify
  const BANK = {
    savings: { opening: 43197.51, closing: 14923.59 },
    current: { opening: 3332.04, closing: 20987.04 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  // Savings
  const savingsTxns = txns.filter(t => t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true);
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => { savingsInc += t.income_amount || 0; savingsExp += t.expense_amount || 0; });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Income:', savingsInc, '(Bank: 385,700.29)');
  console.log('  Expense:', savingsExp, '(Bank: 413,974.21)');
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Diff:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // Current
  const currentTxns = txns.filter(t => t.payment_method === '支票');
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => { currentInc += t.income_amount || 0; currentExp += t.expense_amount || 0; });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Income:', currentInc, '(Bank: 78,268)');
  console.log('  Expense:', currentExp, '(Bank: 60,613)');
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Diff:', (BANK.current.closing - currentClosing).toFixed(2));
})();
