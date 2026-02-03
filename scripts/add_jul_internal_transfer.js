const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// July 2025 Internal Transfer: $22,255 from Savings to Current
// Bank ref: CR EBICT50704160940
const transfers = [
  // Savings out (expense)
  {
    journal_number: 'IT-JUL-001',  // Use IT-MONTH format for internal transfers
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年7月',
    transaction_date: '2025-07-04',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    income_category: null,
    income_amount: 0,
    expense_category: '內部轉帳',
    expense_amount: 22255,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50704160940',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  },
  // Current in (income)
  {
    journal_number: 'IT-JUL-001-IN',  // IN = income side
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年7月',
    transaction_date: '2025-07-04',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_category: '內部轉帳',
    income_amount: 22255,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50704160940 - 對應 Savings 轉出 IT-JUL-001',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  }
];

(async () => {
  console.log('=== Adding July 2025 Internal Transfer Records ===\n');

  // Check if already exists
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', transfers.map(t => t.journal_number));

  if (existing && existing.length > 0) {
    console.log('⚠️ Some records already exist:');
    existing.forEach(r => console.log('  -', r.journal_number));
    console.log('\nAborting to prevent duplicates.');
    return;
  }

  // Insert new records
  const { data, error } = await supabase.from('financial_transactions')
    .insert(transfers)
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Successfully added 2 records:\n');
  data.forEach(t => {
    const amt = t.income_amount || t.expense_amount;
    const type = t.income_amount > 0 ? 'Income' : 'Expense';
    console.log(`  ${t.transaction_date} | ${t.journal_number} | ${type}: $${amt} | ${t.transaction_item}`);
  });

  // Verify balances
  console.log('\n=== Verifying Balances ===');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-07-01')
    .lte('transaction_date', '2025-07-31')
    .order('transaction_date');

  // Savings
  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });
  const savingsIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const savingsExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const savingsClosing = 70815.21 + savingsIncome - savingsExpense;
  console.log('\nSavings: Opening $70815.21 + Income $' + savingsIncome + ' - Expense $' + savingsExpense + ' = $' + savingsClosing.toFixed(2));
  console.log('Bank Closing: $132221.77 | Difference: $' + (savingsClosing - 132221.77).toFixed(2));

  // Current
  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });
  const currentIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const currentExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const currentClosing = 5187.04 + currentIncome - currentExpense;
  console.log('\nCurrent: Opening $5187.04 + Income $' + currentIncome + ' - Expense $' + currentExpense + ' = $' + currentClosing.toFixed(2));
  console.log('Bank Closing: $18147.04 | Difference: $' + (currentClosing - 18147.04).toFixed(2));
})();
