const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function debug() {
  console.log('=== Debug June 2025 Savings Mismatch ===\n');
  
  // Intranet 顯示嘅數字
  const intranetIncome = 293285.48;
  const intranetExpense = 313698.56;
  const intranetClosing = 20665.45;
  
  // Bank Statement
  const bankClosing = 70815.21;
  
  // Get DB data - 用我哋嘅 query
  const { data: myData } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票');

  let myIncome = 0, myExpense = 0;
  myData.forEach(t => {
    myIncome += parseFloat(t.income_amount || 0);
    myExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('My Query (deduct=true, payment!=支票):');
  console.log('  Income:  $' + myIncome.toFixed(2));
  console.log('  Expense: $' + myExpense.toFixed(2));
  console.log('  Closing: $' + (41078.53 + myIncome - myExpense).toFixed(2));
  
  console.log('\nIntranet Shows:');
  console.log('  Income:  $' + intranetIncome.toFixed(2));
  console.log('  Expense: $' + intranetExpense.toFixed(2));
  console.log('  Closing: $' + intranetClosing.toFixed(2));
  
  console.log('\nBank Statement:');
  console.log('  Closing: $' + bankClosing.toFixed(2));
  
  console.log('\n=== Difference Analysis ===');
  console.log('Income diff (Intranet - My): $' + (intranetIncome - myIncome).toFixed(2));
  console.log('Expense diff (Intranet - My): $' + (intranetExpense - myExpense).toFixed(2));
  
  // Check what intranet might be including extra
  // Maybe it's including 支票 income?
  const { data: chequeData } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true);  // All deduct=true, including 支票

  let allIncome = 0, allExpense = 0;
  chequeData.forEach(t => {
    allIncome += parseFloat(t.income_amount || 0);
    allExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('\nAll deduct=true (including 支票):');
  console.log('  Income:  $' + allIncome.toFixed(2));
  console.log('  Expense: $' + allExpense.toFixed(2));
  console.log('  Closing: $' + (41078.53 + allIncome - allExpense).toFixed(2));
  
  // Check if 支票 expense is being included
  const { data: chequeOnly } = await supabase.from('financial_transactions')
    .select('journal_number, income_amount, expense_amount, transaction_item')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .eq('payment_method', '支票');

  console.log('\n支票 records (deduct=true):');
  let chequeInc = 0, chequeExp = 0;
  chequeOnly.forEach(t => {
    console.log('  ' + t.journal_number + ': +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' ' + (t.transaction_item||'').substring(0,30));
    chequeInc += parseFloat(t.income_amount || 0);
    chequeExp += parseFloat(t.expense_amount || 0);
  });
  console.log('  Total: +$' + chequeInc.toFixed(2) + ' -$' + chequeExp.toFixed(2));
}

debug().catch(console.error);
