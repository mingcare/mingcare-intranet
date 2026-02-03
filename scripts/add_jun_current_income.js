const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// 3 筆內部轉帳收入 (Current Account 轉入)
// 對應 Savings 轉出的 journal 00001837, 00001838, 00001839
const internalTransfers = [
  {
    journal_number: 'IT-00001837',  // IT = Internal Transfer, 對應 Savings 轉出
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年6月',
    transaction_date: '2025-06-06',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_category: '內部轉帳',
    income_amount: 21500,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50606108407 - 對應 Savings 轉出 00001837',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  },
  {
    journal_number: 'IT-00001838',
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年6月',
    transaction_date: '2025-06-11',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_category: '內部轉帳',
    income_amount: 1000,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50611116615 - 對應 Savings 轉出 00001838',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  },
  {
    journal_number: 'IT-00001839',
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年6月',
    transaction_date: '2025-06-27',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_category: '內部轉帳',
    income_amount: 50000,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50627147485 - 對應 Savings 轉出 00001839',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  }
];

(async () => {
  console.log('=== Adding 3 Internal Transfer Income Records (Current Account) ===\n');

  // Check if already exists
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', internalTransfers.map(t => t.journal_number));

  if (existing && existing.length > 0) {
    console.log('⚠️ Some records already exist:');
    existing.forEach(r => console.log('  -', r.journal_number));
    console.log('\nAborting to prevent duplicates.');
    return;
  }

  // Insert new records
  const { data, error } = await supabase.from('financial_transactions')
    .insert(internalTransfers)
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Successfully added 3 records:\n');
  data.forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | $${t.income_amount} | ${t.transaction_item}`);
  });

  // Verify Current Account balance
  console.log('\n=== Verifying Current Account Balance ===\n');

  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '支票')
    .order('transaction_date');

  const currentTxns = txns.filter(t => {
    return (t.expense_amount || 0) > 0 || (t.income_amount > 0 && t.income_category === '內部轉帳');
  });

  const totalIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const totalExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const opening = 3420.54;
  const closing = opening + totalIncome - totalExpense;

  console.log('Current Account (after adding internal transfers):');
  console.log('  Opening:  $' + opening.toFixed(2));
  console.log('  Income:   $' + totalIncome.toFixed(2));
  console.log('  Expense:  $' + totalExpense.toFixed(2));
  console.log('  Closing:  $' + closing.toFixed(2));
  console.log('\nBank Statement Closing: $5,187.04');
  console.log('Difference: $' + (5187.04 - closing).toFixed(2));

  if (Math.abs(closing - 5187.04) < 0.01) {
    console.log('\n✅ MATCH!');
  } else {
    console.log('\n❌ Still mismatch. Need to fix expense (商務餐飲費用 $50,000)');
  }
})();
