const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== December 2025 Reconciliation ===\n');
  
  // Step 1: Fix deduct_from_petty_cash = true for 銀行轉賬
  const { data: toFix } = await supabase.from('financial_transactions')
    .select('journal_number')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true)
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31');
  
  if (toFix && toFix.length > 0) {
    const { data: fixed } = await supabase.from('financial_transactions')
      .update({ deduct_from_petty_cash: false })
      .eq('payment_method', '銀行轉賬')
      .eq('deduct_from_petty_cash', true)
      .gte('transaction_date', '2025-12-01')
      .lte('transaction_date', '2025-12-31')
      .select('journal_number');
    console.log('✅ Fixed', fixed.length, 'records (deduct_from_petty_cash = false)');
  } else {
    console.log('✅ No deduct_from_petty_cash issues');
  }
  
  // Step 2: Get all December transactions
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31');
  
  // Check internal transfers
  const its = txns.filter(t => t.journal_number?.startsWith('IT-DEC'));
  console.log('\n內部轉帳記錄:', its.length);
  its.forEach(t => console.log('  ', t.journal_number, t.income_amount || t.expense_amount));
  
  console.log('\n--- Waiting for bank statement data ---');
  console.log('Please provide December bank statement figures:');
  console.log('  Savings: Opening, Closing, Credit, Debit');
  console.log('  Current: Opening, Closing, Credit, Debit');
})();
