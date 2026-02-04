const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Get all October 支票 transactions
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, expense_amount, income_amount, transaction_item, payment_method, income_category')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .eq('payment_method', '支票')
    .order('transaction_date');
  
  console.log('=== October 2025 支票 Transactions ===\n');
  let totalExp = 0, totalInc = 0;
  data.forEach(t => {
    totalExp += t.expense_amount || 0;
    totalInc += t.income_amount || 0;
    console.log(
      t.transaction_date, 
      t.journal_number.padEnd(18), 
      (t.expense_amount ? '-$' + t.expense_amount : '').padStart(10),
      (t.income_amount ? '+$' + t.income_amount : '').padStart(10),
      (t.transaction_item || '').substring(0, 35)
    );
  });
  console.log('');
  console.log('Intranet Total Expense:', totalExp);
  console.log('Intranet Total Income:', totalInc);
  console.log('Bank Expense: 72,840');
  console.log('Bank Income: 74,680');
  console.log('');
  console.log('Expense Diff:', 72840 - totalExp);
  console.log('Income Diff:', 74680 - totalInc);
  
  // Bank CASH PAYMENT breakdown
  console.log('\n=== Bank CASH PAYMENT (should match Intranet expense) ===');
  console.log('10-Oct: $8,180 (支票提取 #000080)');
  console.log('17-Oct: $6,930');
  console.log('17-Oct: $11,330');
  console.log('23-Oct: $3,740');
  console.log('25-Oct: $1,980');
  console.log('28-Oct: $1,320 (INWARD CLEARING)');
  console.log('Total CASH: $33,480');
  console.log('Plus IT-OCT-003 reverse: $39,360');
  console.log('Grand Total Bank Debit: $72,840');
})();
