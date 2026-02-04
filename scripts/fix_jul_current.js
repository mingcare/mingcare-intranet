const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Move 3 cheques from July to August (use cashed date from bank statement)
const updates = [
  { journal: '00000891', cheque: '000026', amount: 4095, newDate: '2025-08-14' },
  { journal: '00001011', cheque: '000035', amount: 5840, newDate: '2025-08-18' },
  { journal: '00001013', cheque: '000037', amount: 7560, newDate: '2025-08-14' },
];

(async () => {
  console.log('=== Moving 3 cross-month cheques from July to August ===\n');

  for (const u of updates) {
    const { data, error } = await supabase.from('financial_transactions')
      .update({ 
        transaction_date: u.newDate, 
        billing_month: '2025年8月',
        notes: 'Cheque ' + u.cheque + ' - 兌現日期 (原開票日 2025-07)'
      })
      .eq('journal_number', u.journal)
      .select();
    
    if (error) {
      console.log('Error updating ' + u.journal + ':', error.message);
    } else {
      console.log('✅ ' + u.journal + ' (Cheque ' + u.cheque + ' $' + u.amount + ') -> ' + u.newDate);
    }
  }

  // Verify July 2025 Current Account
  console.log('\n=== Verifying July 2025 支票戶口 ===');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-07-01')
    .lte('transaction_date', '2025-07-31')
    .order('transaction_date');

  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const income = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const expense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const opening = 5187.04;
  const closing = opening + income - expense;
  const bankClosing = 18147.04;

  console.log('\nTransactions:', currentTxns.length);
  currentTxns.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | Inc:' + inc + ' | Exp:' + exp);
  });

  console.log('\nOpening: $' + opening);
  console.log('Income: $' + income + ' (internal transfer)');
  console.log('Expense: $' + expense);
  console.log('Intranet Closing: $' + closing.toFixed(2));
  console.log('Bank Closing: $' + bankClosing);
  console.log('Difference: $' + (closing - bankClosing).toFixed(2));

  if (Math.abs(closing - bankClosing) < 0.01) {
    console.log('\n✅ July 2025 支票戶口 MATCH!');
  } else {
    console.log('\n❌ Still mismatch');
  }
})();
