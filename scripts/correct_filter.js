const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function debug() {
  console.log('=== Correct Savings Filter (matching bank statement) ===\n');
  
  // The CORRECT filter that matches bank statement:
  // - payment_method = '銀行轉賬' 
  // - payment_method != '支票' (支票 has its own account)
  // - deduct_from_petty_cash = true (this was the key!)
  
  // April 2025
  const { data: apr } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票');
  
  let aprIncome = 0, aprExpense = 0;
  apr.forEach(t => {
    aprIncome += parseFloat(t.income_amount || 0);
    aprExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('=== April 2025 (deduct=true, payment!=支票) ===');
  console.log('Count:', apr.length);
  console.log('Income: $' + aprIncome.toFixed(2));
  console.log('Expense: $' + aprExpense.toFixed(2));
  console.log('Opening: $82,755.59');
  console.log('Closing: $' + (82755.59 + aprIncome - aprExpense).toFixed(2));
  console.log('Expected: $103,530.96');
  
  // June 2025
  const { data: jun } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票');
  
  let junIncome = 0, junExpense = 0;
  jun.forEach(t => {
    junIncome += parseFloat(t.income_amount || 0);
    junExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('\n=== June 2025 (deduct=true, payment!=支票) ===');
  console.log('Count:', jun.length);
  console.log('Income: $' + junIncome.toFixed(2));
  console.log('Expense: $' + junExpense.toFixed(2));
  console.log('Opening: $41,078.53');
  console.log('Closing: $' + (41078.53 + junIncome - junExpense).toFixed(2));
  console.log('Expected: $70,815.21');
  
  // So the correct filter is: deduct_from_petty_cash = true AND payment_method != '支票'
  // This means Intranet should use this exact logic
  
  console.log('\n=== Analysis ===');
  console.log('The correct filter for Savings is:');
  console.log('  deduct_from_petty_cash = true');
  console.log('  AND payment_method != 支票');
  console.log('');
  console.log('Current Intranet filter uses payment_method only,');
  console.log('which includes records with deduct_from_petty_cash = false');
}

debug().catch(console.error);
