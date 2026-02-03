const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// August 2025 Internal Transfer: $8,490 from Savings to Current
// Bank ref: CR EBICT50806219630
const transfers = [
  // Savings out (expense)
  {
    journal_number: 'IT-AUG-001',
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年8月',
    transaction_date: '2025-08-06',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    income_category: null,
    income_amount: 0,
    expense_category: '內部轉帳',
    expense_amount: 8490,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50806219630',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  },
  // Current in (income)
  {
    journal_number: 'IT-AUG-001-IN',
    transaction_code: null,
    fiscal_year: 2025,
    billing_month: '2025年8月',
    transaction_date: '2025-08-06',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_category: '內部轉帳',
    income_amount: 8490,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    reimbursement_status: null,
    notes: 'CR EBICT50806219630 - 對應 Savings 轉出 IT-AUG-001',
    deduct_from_petty_cash: false,
    is_deleted: false,
    sort_order: 0
  }
];

(async () => {
  console.log('=== Adding August 2025 Internal Transfer Records ===\n');

  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', transfers.map(t => t.journal_number));

  if (existing && existing.length > 0) {
    console.log('⚠️ Records already exist:', existing.map(r => r.journal_number).join(', '));
    console.log('Aborting.');
    return;
  }

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
    console.log(`  ${t.transaction_date} | ${t.journal_number} | ${type}: $${amt}`);
  });

  // Verify
  console.log('\n=== Re-running Reconciliation ===');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .order('transaction_date');

  // Current Account
  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const currentIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const currentExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  
  // 計算 July 跨月支票
  const julyCrossMonth = 4095 + 5840 + 7560; // 000026 + 000035 + 000037
  
  // Current Account closing 需要考慮跨月支票
  // Bank statement 計兌現日期，Intranet 計開票日期
  // 所以 Intranet 8月冇呢 3 筆，但 Bank 有
  const opening = 18147.04;
  const intranetClosing = opening + currentIncome - currentExpense;
  const bankClosing = 652.04;
  
  console.log('\nCurrent Account:');
  console.log('  Opening: $' + opening);
  console.log('  Income: $' + currentIncome + ' (internal transfer)');
  console.log('  Expense: $' + currentExpense + ' (Aug cheques only)');
  console.log('  Intranet Closing: $' + intranetClosing.toFixed(2));
  console.log('  Bank Closing: $' + bankClosing);
  console.log('  Difference: $' + (intranetClosing - bankClosing).toFixed(2));
  console.log('');
  console.log('Note: Bank includes $' + julyCrossMonth + ' from July cheques cashed in Aug');
  console.log('Adjusted Intranet Closing: $' + (intranetClosing - julyCrossMonth).toFixed(2));
})();
