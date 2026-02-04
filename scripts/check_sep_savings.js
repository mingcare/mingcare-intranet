const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// September 2025 Bank Statement
// Savings: Opening $114,671.46, Closing $180,669.99, Credit $420,898.53, Debit $354,900.00
// Current: Opening $652.04, Closing $1,492.04, Credit $61,600, Debit $60,760

(async () => {
  // === ALL 銀行轉賬 transactions ===
  const { data: allBankTransfer } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .order('transaction_date');
  
  console.log('=== All 銀行轉賬 (No filter) ===');
  let totalInc = 0, totalExp = 0;
  allBankTransfer.forEach(t => {
    totalInc += t.income_amount || 0;
    totalExp += t.expense_amount || 0;
  });
  console.log('Records:', allBankTransfer.length);
  console.log('Total Income:', totalInc);
  console.log('Total Expense:', totalExp);
  console.log('Net:', totalInc - totalExp);
  
  // Check deduct values
  const deductTrue = allBankTransfer.filter(t => t.deduct_from_petty_cash === true).length;
  const deductFalse = allBankTransfer.filter(t => t.deduct_from_petty_cash === false).length;
  const deductNull = allBankTransfer.filter(t => t.deduct_from_petty_cash === null).length;
  console.log('\ndeduct_from_petty_cash distribution:');
  console.log('  true:', deductTrue);
  console.log('  false:', deductFalse);
  console.log('  null:', deductNull);
  
  // === Savings Account Filter (as per Intranet logic) ===
  // 儲蓄戶口 = 銀行轉賬 AND deduct_from_petty_cash != true
  console.log('\n=== Savings Account (deduct != true) ===');
  const savingsRecords = allBankTransfer.filter(t => t.deduct_from_petty_cash !== true);
  let savingsInc = 0, savingsExp = 0;
  savingsRecords.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  console.log('Records:', savingsRecords.length);
  console.log('Income:', savingsInc);
  console.log('Expense:', savingsExp);
  console.log('Net:', savingsInc - savingsExp);
  
  console.log('\nBank Statement Savings Net: 65,998.53 (180669.99 - 114671.46)');
  console.log('Difference:', 65998.53 - (savingsInc - savingsExp));
  
  // === Show all Savings records ===
  console.log('\n=== Detail: Savings Records ===');
  savingsRecords.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    console.log(
      t.transaction_date,
      t.journal_number.padEnd(15),
      (inc ? '+$' + inc : '').padStart(12),
      (exp ? '-$' + exp : '').padStart(12),
      (t.expense_category || t.income_category || '').substring(0, 20)
    );
  });
})();
