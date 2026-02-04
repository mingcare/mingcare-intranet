const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

/*
  June 2025 Savings Account 修正（第三輪）
  
  問題：現金支出唔應該出現喺儲蓄戶口 view
  - 現金支出係從 Petty Cash 出，唔係從儲蓄戶口出
  - 要將 payment_method = '現金' 嘅記錄設為 deduct_from_petty_cash = false
  
  DB 銀行轉賬支出: $263,548.56
  Bank Statement 支出: $263,543.56
  差: $5 (可能係 FPS fee)
*/

(async () => {
  console.log('=== June 2025 Savings Account 修正（第三輪）===\n');

  // 將所有 June 2025 現金支出設為 deduct_from_petty_cash = false
  console.log('--- 將現金支出移出儲蓄戶口 view ---');
  
  const { data: cashExpenses, error: err1 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, expense_amount, transaction_item')
    .eq('payment_method', '現金')
    .eq('deduct_from_petty_cash', true)
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .gt('expense_amount', 0);

  console.log('Found', cashExpenses?.length || 0, 'cash expense records');

  if (cashExpenses && cashExpenses.length > 0) {
    let totalCash = 0;
    const journalNumbers = cashExpenses.map(t => {
      totalCash += parseFloat(t.expense_amount);
      return t.journal_number;
    });

    console.log('Total cash expense: $' + totalCash.toFixed(2));
    console.log('Updating', journalNumbers.length, 'records...');

    // Update all cash expenses
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ deduct_from_petty_cash: false })
      .in('journal_number', journalNumbers)
      .select('journal_number');

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✓ Updated', data.length, 'cash expense records');
      console.log('  呢啲現金支出會出現喺 Petty Cash view，唔會出現喺儲蓄戶口 view');
    }
  }

  // 驗證結果
  console.log('\n--- 驗證結果 ---');
  
  const { data: juneSavings } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false);

  let totalIn = 0, totalOut = 0;
  
  juneSavings?.forEach(t => {
    const inc = parseFloat(t.income_amount) || 0;
    const exp = parseFloat(t.expense_amount) || 0;
    totalIn += inc;
    totalOut += exp;
  });

  const opening = 41078.53;
  const closing = opening + totalIn - totalOut;
  
  console.log('\n--- Summary ---');
  console.log('Opening Balance: $' + opening.toFixed(2));
  console.log('Total Income:   +$' + totalIn.toFixed(2));
  console.log('Total Expense:  -$' + totalOut.toFixed(2));
  console.log('Net Change:      $' + (totalIn - totalOut).toFixed(2));
  console.log('Closing Balance: $' + closing.toFixed(2));
  console.log('Expected:        $70,815.21');
  
  const diff = Math.abs(closing - 70815.21);
  console.log('\nDifference: $' + diff.toFixed(2));

  if (diff < 10) {
    console.log('✅ Very close! Small difference may be due to FPS fee rounding');
    
    // Check FPS fee total
    const { data: fpsFees } = await supabase
      .from('financial_transactions')
      .select('expense_amount')
      .ilike('transaction_item', '%FPS%手續費%')
      .gte('transaction_date', '2025-06-01')
      .lte('transaction_date', '2025-06-30')
      .eq('is_deleted', false);
    
    const dbFpsTotal = fpsFees?.reduce((s, t) => s + parseFloat(t.expense_amount), 0) || 0;
    console.log('\nDB FPS Fee Total: $' + dbFpsTotal.toFixed(2));
    console.log('Bank FPS Fee Total: $155.00 (31 x $5)');
    console.log('FPS Fee Diff: $' + (dbFpsTotal - 155).toFixed(2));
  } else {
    console.log('❌ Still needs adjustment');
  }
})();
