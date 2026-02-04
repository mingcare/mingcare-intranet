const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function debug() {
  console.log('=== Debug April 2025 Savings ===\n');
  
  // Get all April 2025 transactions
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('is_deleted', false)
    .order('transaction_date');

  console.log('Total transactions in April:', data.length);
  
  // Check deduct_from_petty_cash distribution
  const deductTrue = data.filter(t => t.deduct_from_petty_cash === true);
  const deductFalse = data.filter(t => t.deduct_from_petty_cash === false);
  const deductNull = data.filter(t => t.deduct_from_petty_cash === null);
  
  console.log('deduct_from_petty_cash = true:', deductTrue.length);
  console.log('deduct_from_petty_cash = false:', deductFalse.length);
  console.log('deduct_from_petty_cash = null:', deductNull.length);
  
  // Old filter (before fix) - payment_method = '銀行轉賬'
  const oldFilter = data.filter(t => {
    const pm = (t.payment_method || '').trim();
    if (pm === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return pm === '銀行轉賬';
  });
  
  // New filter (after fix) - payment_method = '銀行轉賬' AND deduct_from_petty_cash !== false
  const newFilter = data.filter(t => {
    if (t.deduct_from_petty_cash === false) return false;
    const pm = (t.payment_method || '').trim();
    if (pm === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return pm === '銀行轉賬';
  });
  
  console.log('\n--- Old Filter (before fix) ---');
  let oldIncome = 0, oldExpense = 0;
  oldFilter.forEach(t => {
    oldIncome += parseFloat(t.income_amount || 0);
    oldExpense += parseFloat(t.expense_amount || 0);
  });
  console.log('Count:', oldFilter.length);
  console.log('Income: $' + oldIncome.toFixed(2));
  console.log('Expense: $' + oldExpense.toFixed(2));
  console.log('Closing: $' + (82755.59 + oldIncome - oldExpense).toFixed(2));
  
  console.log('\n--- New Filter (after fix) ---');
  let newIncome = 0, newExpense = 0;
  newFilter.forEach(t => {
    newIncome += parseFloat(t.income_amount || 0);
    newExpense += parseFloat(t.expense_amount || 0);
  });
  console.log('Count:', newFilter.length);
  console.log('Income: $' + newIncome.toFixed(2));
  console.log('Expense: $' + newExpense.toFixed(2));
  console.log('Closing: $' + (82755.59 + newIncome - newExpense).toFixed(2));
  
  console.log('\n--- Bank Statement ---');
  console.log('Expected Closing: $103,530.96');
  
  // Show records with deduct_from_petty_cash = false
  console.log('\n--- Records with deduct=false (excluded by new filter) ---');
  const excluded = oldFilter.filter(t => t.deduct_from_petty_cash === false);
  excluded.forEach(t => {
    console.log(t.journal_number + ' | ' + t.payment_method + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,40));
  });
  
  // Show records with deduct_from_petty_cash = null (銀行轉賬)
  console.log('\n--- Records with deduct=null (銀行轉賬) ---');
  const nullRecords = newFilter.filter(t => t.deduct_from_petty_cash === null);
  console.log('Count:', nullRecords.length);
  nullRecords.slice(0, 5).forEach(t => {
    console.log(t.journal_number + ' | ' + t.payment_method + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0));
  });
}

debug().catch(console.error);
