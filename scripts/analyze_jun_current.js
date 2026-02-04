const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

// Bank Statement - Current Account June 2025
// Opening: $3,420.54
// Credit (Income): $1,840.00
// Debit (Expense): $73.50
// Closing: $5,187.04

(async () => {
  console.log('='.repeat(70));
  console.log('June 2025 Current Account Analysis');
  console.log('='.repeat(70));
  
  // Get all June 2025 支票 transactions
  const { data: chequeTxns, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '支票')
    .order('transaction_date');
  
  if (error) { console.error(error); return; }
  
  console.log('\n📋 All 支票 transactions in June 2025:');
  console.log('-'.repeat(70));
  chequeTxns.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.transaction_item?.substring(0,40)} | +$${t.income_amount || 0} -$${t.expense_amount || 0} | ${t.expense_category || t.income_category || ''}`);
  });
  
  // Get 內部轉帳 records
  const { data: internalTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .or('expense_category.eq.內部轉帳,income_category.eq.內部轉帳')
    .order('transaction_date');
  
  console.log('\n📋 All 內部轉帳 transactions in June 2025:');
  console.log('-'.repeat(70));
  internalTxns.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.payment_method} | ${t.transaction_item?.substring(0,35)} | +$${t.income_amount || 0} -$${t.expense_amount || 0}`);
  });
  
  console.log('\n📊 Bank Statement vs Intranet:');
  console.log('-'.repeat(70));
  console.log('Bank Current Account:');
  console.log('  Opening:  $3,420.54');
  console.log('  Credit:   $1,840.00');
  console.log('  Debit:    $73.50');
  console.log('  Closing:  $5,187.04');
  
  console.log('\n💡 Analysis:');
  console.log('-'.repeat(70));
  console.log('The $1,840 credit to Current Account needs to be recorded');
  console.log('The $73.50 debit from Current Account needs to be recorded');
  console.log('');
  console.log('Currently, 支票 transactions are all expenses (cheque payments)');
  console.log('but these are likely paid from Savings Account, not Current Account');
  console.log('');
  console.log('🔧 Fix needed:');
  console.log('1. Add income record: $1,840 (內部轉帳 from Savings to Current)');
  console.log('2. Add expense record: $73.50 (Bank fees - 支票簿費用)');
})();
