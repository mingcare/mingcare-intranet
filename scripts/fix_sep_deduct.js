const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Fix: 將 September 2025 所有 payment_method='銀行轉賬' 但 deduct_from_petty_cash=true 嘅記錄改為 false
// 因為銀行轉賬應該出現喺儲蓄戶口 view

(async () => {
  // First, get all affected records
  const { data: before } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, income_amount, expense_amount, deduct_from_petty_cash')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  console.log('=== Records to fix ===');
  console.log('Count:', before.length);
  
  if (before.length === 0) {
    console.log('No records to fix!');
    return;
  }
  
  // Update all 銀行轉賬 records in September 2025 to deduct_from_petty_cash = false
  const { data: updated, error } = await supabase.from('financial_transactions')
    .update({ deduct_from_petty_cash: false })
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true)
    .select('journal_number');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('✅ Updated', updated.length, 'records: deduct_from_petty_cash = false');
  
  // Verify savings account totals
  const { data: savings } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false);
  
  let totalInc = 0, totalExp = 0;
  savings.forEach(t => {
    totalInc += t.income_amount || 0;
    totalExp += t.expense_amount || 0;
  });
  
  const opening = 114671.46;
  const closing = opening + totalInc - totalExp;
  
  console.log('\n=== September 2025 儲蓄戶口 After Fix ===');
  console.log('Opening:', opening);
  console.log('Income:', totalInc);
  console.log('Expense:', totalExp);
  console.log('Intranet Closing:', closing.toFixed(2));
  console.log('Bank Closing: 180,669.99');
  console.log('Difference:', (180669.99 - closing).toFixed(2));
})();
