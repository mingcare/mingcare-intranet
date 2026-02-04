const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// October 2025 Internal Transfers
// 2 x Savings → Current (forward)
// 1 x Current → Savings (reverse)

const transfers = [
  // 06-Oct: Savings out $55,000
  {
    journal_number: 'IT-OCT-001',
    transaction_date: '2025-10-06',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    expense_amount: 55000,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT51006328135',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 06-Oct: Current in $55,000
  {
    journal_number: 'IT-OCT-001-IN',
    transaction_date: '2025-10-06',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_amount: 55000,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT51006328135',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 10-Oct: Savings out $19,680
  {
    journal_number: 'IT-OCT-002',
    transaction_date: '2025-10-10',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    expense_amount: 19680,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT51010336739',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 10-Oct: Current in $19,680
  {
    journal_number: 'IT-OCT-002-IN',
    transaction_date: '2025-10-10',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_amount: 19680,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT51010336739',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 10-Oct: REVERSE - Current out $39,360 (to Savings)
  {
    journal_number: 'IT-OCT-003',
    transaction_date: '2025-10-10',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)',
    payment_method: '支票',
    expense_amount: 39360,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT51010336840',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 10-Oct: REVERSE - Savings in $39,360 (from Current)
  {
    journal_number: 'IT-OCT-003-IN',
    transaction_date: '2025-10-10',
    billing_month: '2025年10月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)',
    payment_method: '銀行轉賬',
    income_amount: 39360,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT51010336840',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  }
];

(async () => {
  console.log('=== Adding October 2025 Internal Transfers ===\n');
  
  // Check if already exists
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
    
    console.log('✅ Added', data.length, 'records:');
    data.forEach(r => {
      console.log(' ', r.journal_number, r.income_amount ? '+$' + r.income_amount : '-$' + r.expense_amount);
    });
  }
  
  // Verify
  console.log('\n=== Verifying October 2025 ===');
  
  const BANK = {
    savings: { opening: 180669.99, closing: 43197.51 },
    current: { opening: 1492.04, closing: 3332.04 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .eq('deduct_from_petty_cash', false);
  
  // Savings
  const savingsTxns = txns.filter(t => t.payment_method === '銀行轉賬');
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Opening:', BANK.savings.opening);
  console.log('  Income:', savingsInc);
  console.log('  Expense:', savingsExp);
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Difference:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // Current
  const currentTxns = txns.filter(t => 
    t.payment_method === '支票' && 
    ((t.expense_amount || 0) > 0 || t.income_category === '內部轉帳')
  );
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => {
    currentInc += t.income_amount || 0;
    currentExp += t.expense_amount || 0;
  });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Opening:', BANK.current.opening);
  console.log('  Income:', currentInc, '(Bank: 74,680)');
  console.log('  Expense:', currentExp, '(Bank: 72,840)');
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Difference:', (BANK.current.closing - currentClosing).toFixed(2));
})();
