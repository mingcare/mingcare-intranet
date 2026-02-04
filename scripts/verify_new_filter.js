const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// New filter logic
function filterSavings(t) {
  const paymentMethod = (t.payment_method || '').trim();
  const isCashPayment = paymentMethod === '現金';
  
  // isLedgerTransaction check
  const isLedgerTransaction = (
    paymentMethod === '銀行轉賬' ||
    paymentMethod === '支票' ||
    !paymentMethod ||
    (isCashPayment && t.deduct_from_petty_cash === false)
  );
  
  if (!isLedgerTransaction) return false;
  
  // Savings filter - exclude 內部轉帳
  if (t.income_category === '內部轉帳' || t.expense_category === '內部轉帳') return false;
  
  if (paymentMethod === '支票') {
    return (t.income_amount || 0) > 0 && !(t.expense_amount > 0);
  }
  return paymentMethod === '銀行轉賬';
}

async function verify() {
  console.log('=== Verify New Filter Logic ===\n');
  
  // April 2025
  const { data: apr } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('is_deleted', false);
  
  const aprFiltered = apr.filter(filterSavings);
  let aprIncome = 0, aprExpense = 0;
  aprFiltered.forEach(t => {
    aprIncome += parseFloat(t.income_amount || 0);
    aprExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('=== April 2025 Savings ===');
  console.log('Count:', aprFiltered.length);
  console.log('Income: $' + aprIncome.toFixed(2));
  console.log('Expense: $' + aprExpense.toFixed(2));
  console.log('Opening: $82,755.59');
  console.log('Closing: $' + (82755.59 + aprIncome - aprExpense).toFixed(2));
  console.log('Expected: $103,530.96');
  console.log('Match:', Math.abs(82755.59 + aprIncome - aprExpense - 103530.96) < 0.01 ? '✅' : '❌');
  
  // June 2025
  const { data: jun } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false);
  
  const junFiltered = jun.filter(filterSavings);
  let junIncome = 0, junExpense = 0;
  junFiltered.forEach(t => {
    junIncome += parseFloat(t.income_amount || 0);
    junExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('\n=== June 2025 Savings ===');
  console.log('Count:', junFiltered.length);
  console.log('Income: $' + junIncome.toFixed(2));
  console.log('Expense: $' + junExpense.toFixed(2));
  console.log('Opening: $41,078.53');
  console.log('Closing: $' + (41078.53 + junIncome - junExpense).toFixed(2));
  console.log('Expected: $70,815.21');
  console.log('Match:', Math.abs(41078.53 + junIncome - junExpense - 70815.21) < 0.01 ? '✅' : '❌');
  
  // Show what's in June that wasn't before
  console.log('\n--- June transactions included ---');
  junFiltered.slice(0, 10).forEach(t => {
    console.log(t.journal_number + ' | ' + t.payment_method + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,30));
  });
  console.log('...');
}

verify().catch(console.error);
