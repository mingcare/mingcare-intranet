const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

/*
  June 2025 Savings Account 修正（第二輪）
  
  問題：
  1. 00000984 ($50,000 商務餐飲) - 唔喺 bank statement，要設為 deduct_from_petty_cash = false
  2. 需要加 Kanas 6月份工資 $4,750 (06-30)
  
  Bank Statement 唔喺 DB:
  - 無
  
  DB 唔喺 Bank Statement:
  - 00000984 $50,000 商務餐飲 → 改為 deduct_from_petty_cash = false
*/

(async () => {
  console.log('=== June 2025 Savings Account 修正（第二輪）===\n');

  // 1. 將 00000984 移出儲蓄戶口 view
  console.log('--- Step 1: 修正 00000984 (商務餐飲) ---');
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ deduct_from_petty_cash: false })
    .eq('journal_number', '00000984')
    .select('journal_number, transaction_item, deduct_from_petty_cash');
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✓ 00000984: deduct_from_petty_cash = false');
    console.log('  呢筆唔會出現喺儲蓄戶口 view');
  }

  // 2. 檢查 Kanas 6月份工資
  console.log('\n--- Step 2: 檢查 Kanas 6月份工資 ---');
  
  const { data: kanas } = await supabase
    .from('financial_transactions')
    .select('*')
    .ilike('transaction_item', '%Kanas%6月%')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false);
  
  console.log('Found Kanas salary records:');
  kanas.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | -$${t.expense_amount} | ${t.transaction_item}`);
  });
  
  // Bank Statement 有兩筆 Kanas:
  // 06-22/23: $19,000 (00000960) ✓
  // 06-30: $4,750 (00000991) - 需要確認

  const { data: kanas991 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00000991')
    .single();
  
  console.log('\n00000991 details:');
  console.log('Date:', kanas991?.transaction_date);
  console.log('Amount:', kanas991?.expense_amount);
  console.log('Item:', kanas991?.transaction_item);

  // 3. 驗證結果
  console.log('\n--- Step 3: 驗證結果 ---');
  
  const { data: juneSavings } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');

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
  console.log(diff < 1 ? '✅ MATCH!' : '❌ Still needs adjustment');

  if (diff > 1) {
    console.log('\n--- Expected vs Actual ---');
    console.log('Bank Income:    $293,280.24');
    console.log('Bank Expense:   $263,543.56');
    console.log('DB Income:      $' + totalIn.toFixed(2));
    console.log('DB Expense:     $' + totalOut.toFixed(2));
    console.log('Income Diff:    $' + (totalIn - 293280.24).toFixed(2));
    console.log('Expense Diff:   $' + (totalOut - 263543.56).toFixed(2));
  }
})();
