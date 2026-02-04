const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function debug() {
  console.log('=== Debug Intranet Savings Filter ===\n');
  
  // Get all June 2025 transactions
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date');

  // Simulate Intranet's getLedgerTransactions filter for savings
  // From code: accountType === 'savings'
  const savingsFiltered = data.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    const isCashPayment = paymentMethod === '現金';
    
    // isLedgerTransaction check from code
    const isLedgerTransaction = !(
      !paymentMethod ||
      (isCashPayment && t.deduct_from_petty_cash === false)
    );
    
    if (!isLedgerTransaction) return false;
    
    // Savings filter from code
    if (paymentMethod === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return paymentMethod === '銀行轉賬';
  });

  console.log('Intranet Savings Filter Result:');
  console.log('Transaction count:', savingsFiltered.length);
  
  let totalIncome = 0, totalExpense = 0;
  savingsFiltered.forEach(t => {
    totalIncome += parseFloat(t.income_amount || 0);
    totalExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('Total Income: $' + totalIncome.toFixed(2));
  console.log('Total Expense: $' + totalExpense.toFixed(2));
  console.log('');
  
  // Compare with what it SHOULD be
  // Correct filter: deduct_from_petty_cash = true AND payment_method != '支票'
  const correctFiltered = data.filter(t => {
    return t.deduct_from_petty_cash === true && t.payment_method !== '支票';
  });
  
  console.log('Correct Filter (deduct=true, payment!=支票):');
  console.log('Transaction count:', correctFiltered.length);
  
  let correctIncome = 0, correctExpense = 0;
  correctFiltered.forEach(t => {
    correctIncome += parseFloat(t.income_amount || 0);
    correctExpense += parseFloat(t.expense_amount || 0);
  });
  
  console.log('Total Income: $' + correctIncome.toFixed(2));
  console.log('Total Expense: $' + correctExpense.toFixed(2));
  
  // Find transactions that are in Intranet but shouldn't be
  console.log('\n=== Transactions in Intranet but NOT correct ===');
  const wronglyIncluded = savingsFiltered.filter(t => {
    return !(t.deduct_from_petty_cash === true && t.payment_method !== '支票');
  });
  
  console.log('Count:', wronglyIncluded.length);
  let wrongIncome = 0, wrongExpense = 0;
  wronglyIncluded.forEach(t => {
    console.log(t.journal_number + ' | ' + t.payment_method + ' | deduct=' + t.deduct_from_petty_cash + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,30));
    wrongIncome += parseFloat(t.income_amount || 0);
    wrongExpense += parseFloat(t.expense_amount || 0);
  });
  console.log('Wrong Income: $' + wrongIncome.toFixed(2));
  console.log('Wrong Expense: $' + wrongExpense.toFixed(2));
  
  // Find transactions that SHOULD be in but Intranet missed
  console.log('\n=== Transactions SHOULD be in but Intranet missed ===');
  const missed = correctFiltered.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    const isCashPayment = paymentMethod === '現金';
    const isLedgerTransaction = !(
      !paymentMethod ||
      (isCashPayment && t.deduct_from_petty_cash === false)
    );
    if (!isLedgerTransaction) return true;  // Should be in but filtered out
    if (paymentMethod === '支票') {
      if (!((t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳')) {
        return true;
      }
    }
    if (paymentMethod !== '銀行轉賬' && paymentMethod !== '支票') return true;
    return false;
  });
  
  console.log('Count:', missed.length);
  missed.forEach(t => {
    console.log(t.journal_number + ' | ' + t.payment_method + ' | deduct=' + t.deduct_from_petty_cash + ' | +$' + (t.income_amount||0) + ' -$' + (t.expense_amount||0) + ' | ' + (t.transaction_item||'').substring(0,30));
  });
}

debug().catch(console.error);
