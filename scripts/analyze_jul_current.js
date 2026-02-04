const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement July 2025 Current Account expenses
const bankExpenses = [
  { date: '08-Jul-25', amount: 220, cheque: '000074' },
  { date: '08-Jul-25', amount: 1870, cheque: '000038' },
  { date: '09-Jul-25', amount: 5025, cheque: '000034' },
  { date: '09-Jul-25', amount: 1600, cheque: '000033' },
  { date: '15-Jul-25', amount: 360, cheque: '000036' },
  { date: '19-Jul-25', amount: 220, cheque: '000040' },
];
const bankTotal = bankExpenses.reduce((sum, t) => sum + t.amount, 0);

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, expense_amount, transaction_item')
    .gte('transaction_date', '2025-07-01')
    .lte('transaction_date', '2025-07-31')
    .eq('payment_method', '支票')
    .gt('expense_amount', 0)
    .order('transaction_date');

  console.log('=== July 2025 Current Account Expense Analysis ===\n');
  
  console.log('Bank Statement Expenses:');
  bankExpenses.forEach(t => console.log(`  ${t.date} | Cheque ${t.cheque} | $${t.amount}`));
  console.log('  Total: $' + bankTotal);
  
  console.log('\nIntranet Expenses (payment_method=支票):');
  let total = 0;
  data.forEach(t => {
    total += t.expense_amount;
    const match = bankExpenses.some(b => t.expense_amount === b.amount);
    const status = match ? '✅' : '❌';
    console.log(`  ${status} ${t.transaction_date} | ${t.journal_number} | $${t.expense_amount} | ${(t.transaction_item || '').substring(0,35)}`);
  });
  console.log('  Total: $' + total);
  
  console.log('\nDifference: $' + (total - bankTotal));
  console.log('\nAnalysis:');
  console.log('Bank has 6 expenses totaling $9,295');
  console.log('Intranet has', data.length, 'expenses totaling $' + total);
  console.log('Extra in Intranet: $' + (total - bankTotal));
  
  // Find items that don't match bank
  console.log('\nPossibly wrong records (not in bank statement):');
  data.forEach(t => {
    const inBank = bankExpenses.some(b => {
      // Match by cheque number in transaction_item or by amount
      return t.transaction_item && (
        t.transaction_item.includes(b.cheque) ||
        (t.expense_amount === b.amount && t.transaction_item.includes('支票'))
      );
    });
    if (!inBank) {
      console.log(`  ❌ ${t.journal_number} | $${t.expense_amount} | ${t.transaction_item}`);
    }
  });
})();
