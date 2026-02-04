const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== November Savings Account Analysis ===\n');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  // Filter out deduct_from_petty_cash = true
  const valid = txns.filter(t => t.deduct_from_petty_cash !== true);
  
  // Income records
  console.log('收入 (Income):');
  let totalInc = 0;
  valid.filter(t => t.income_amount > 0).sort((a,b) => b.income_amount - a.income_amount).forEach(t => {
    totalInc += t.income_amount;
    console.log(`  ${t.transaction_date} | ${t.journal_number.padEnd(15)} | $${t.income_amount.toString().padStart(8)} | ${t.income_category || ''} | ${t.transaction_item?.substring(0,30)}`);
  });
  console.log('  Total Income:', totalInc);
  console.log('  Bank Income: 385,700.29');
  console.log('  Diff:', (385700.29 - totalInc).toFixed(2), '\n');
  
  // Expense records
  console.log('支出 (Expense):');
  let totalExp = 0;
  valid.filter(t => t.expense_amount > 0).sort((a,b) => b.expense_amount - a.expense_amount).forEach(t => {
    totalExp += t.expense_amount;
    console.log(`  ${t.transaction_date} | ${t.journal_number.padEnd(15)} | $${t.expense_amount.toString().padStart(8)} | ${t.expense_category || ''} | ${t.transaction_item?.substring(0,30)}`);
  });
  console.log('  Total Expense:', totalExp);
  console.log('  Bank Expense: 413,974.21');
  console.log('  Diff:', (413974.21 - totalExp).toFixed(2));
  
  // Summary
  console.log('\n=== Summary ===');
  console.log('Income Diff (Bank - Intranet):', (385700.29 - totalInc).toFixed(2));
  console.log('Expense Diff (Bank - Intranet):', (413974.21 - totalExp).toFixed(2));
  console.log('Net effect on closing:', ((413974.21 - totalExp) - (385700.29 - totalInc)).toFixed(2));
})();
