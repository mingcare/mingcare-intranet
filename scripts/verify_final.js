const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  let balance = 0;
  
  pettyCashTxns.sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date.localeCompare(b.transaction_date);
    }
    return (a.journal_number || '').localeCompare(b.journal_number || '');
  });

  let balanceAt1698 = 0;

  for (const t of pettyCashTxns) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }

    if (t.journal_number === '00001698') {
      balanceAt1698 = balance;
      console.log('Found 1698:');
      console.log('  Date:', t.transaction_date);
      console.log('  Description:', t.description);
      console.log('  Expense:', t.expense_amount);
      console.log('  Balance:', balance.toFixed(2));
    }
  }

  console.log('=====================================');
  console.log('Balance at 1698:', balanceAt1698.toFixed(2));
  console.log('Target: 1035.80');
  console.log('=====================================');
  
  if (Math.abs(balanceAt1698 - 1035.80) < 0.01) {
    console.log('OK - Balance is correct!');
  } else {
    console.log('WRONG - Difference:', (balanceAt1698 - 1035.80).toFixed(2));
  }

  process.exit(0);
})();
