const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// December 2025 Internal Transfers
// 1 x Forward (S→C): $68,449
// 2 x Reverse (C→S): $10,575 + $13,000 = $23,575

const transfers = [
  // IT-DEC-001: 08-Dec S→C $68,449
  { journal_number: 'IT-DEC-001', transaction_date: '2025-12-08', billing_month: '2025年12月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口', payment_method: '銀行轉賬',
    expense_amount: 68449, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51208446323', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-DEC-001-IN', transaction_date: '2025-12-08', billing_month: '2025年12月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口', payment_method: '支票',
    income_amount: 68449, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51208446323', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-DEC-002: 08-Dec C→S $10,575 (REVERSE)
  { journal_number: 'IT-DEC-002', transaction_date: '2025-12-08', billing_month: '2025年12月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)', payment_method: '支票',
    expense_amount: 10575, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51208446818', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-DEC-002-IN', transaction_date: '2025-12-08', billing_month: '2025年12月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)', payment_method: '銀行轉賬',
    income_amount: 10575, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51208446818', fiscal_year: 2025, deduct_from_petty_cash: false },
  
  // IT-DEC-003: 12-Dec C→S $13,000 (REVERSE)
  { journal_number: 'IT-DEC-003', transaction_date: '2025-12-12', billing_month: '2025年12月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)', payment_method: '支票',
    expense_amount: 13000, expense_category: '內部轉帳', income_amount: 0,
    notes: 'EBICT51208446485', fiscal_year: 2025, deduct_from_petty_cash: false },
  { journal_number: 'IT-DEC-003-IN', transaction_date: '2025-12-12', billing_month: '2025年12月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)', payment_method: '銀行轉賬',
    income_amount: 13000, income_category: '內部轉帳', expense_amount: 0,
    notes: 'EBICT51208446485', fiscal_year: 2025, deduct_from_petty_cash: false }
];

(async () => {
  console.log('=== Adding December 2025 Internal Transfers ===\n');
  
  // Check existing
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', transfers.map(t => t.journal_number));
  
  const existingNums = existing?.map(e => e.journal_number) || [];
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
})();
