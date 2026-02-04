const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function fixFee() {
  // Update EX-0026 from $100 to $110
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ expense_amount: 110 })
    .eq('journal_number', 'EX-0026')
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Updated EX-0026 expense_amount from $100 to $110');
  console.log('Updated record:', data);

  // Verify the balance
  const { data: aprData, error: aprError } = await supabase
    .from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('payment_method', '銀行轉賬')
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (aprError) {
    console.error('Error:', aprError);
    return;
  }

  let totalIncome = 0;
  let totalExpense = 0;
  aprData.forEach(t => {
    totalIncome += t.income_amount || 0;
    totalExpense += t.expense_amount || 0;
  });

  const openingBalance = 82755.59;
  const closingBalance = openingBalance + totalIncome - totalExpense;
  
  console.log('\n=== Verification ===');
  console.log('Opening Balance: $82,755.59');
  console.log('Total Income:', totalIncome.toFixed(2));
  console.log('Total Expense:', totalExpense.toFixed(2));
  console.log('Calculated Closing Balance:', closingBalance.toFixed(2));
  console.log('Bank Statement Closing: $103,530.96');
  console.log('Difference:', (closingBalance - 103530.96).toFixed(2));
  
  if (Math.abs(closingBalance - 103530.96) < 0.01) {
    console.log('\n✅ PERFECT MATCH! Balance matches bank statement exactly!');
  }
}

fixFee();
