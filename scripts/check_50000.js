const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Check 00000984 - the $50,000 商務餐飲
  console.log('--- Check 00000984 (商務餐飲 $50,000) ---');
  const { data: rec984 } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00000984')
    .single();
  
  console.log('Date:', rec984.transaction_date);
  console.log('Item:', rec984.transaction_item);
  console.log('Payment Method:', rec984.payment_method);
  console.log('Expense Amount:', rec984.expense_amount);
  console.log('deduct_from_petty_cash:', rec984.deduct_from_petty_cash);
  console.log('Notes:', rec984.notes);

  // Check Petty Cash transfers (Candy $5000)
  console.log('\n--- Check Petty Cash Transfers ---');
  const { data: petty } = await supabase.from('financial_transactions')
    .select('*')
    .ilike('transaction_item', '%Petty Cash%')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  petty.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | -$${t.expense_amount} | deduct=${t.deduct_from_petty_cash} | ${t.transaction_item}`);
  });

  // 問題：00000984 應該 deduct_from_petty_cash = false（唔係從銀行出）
  // 因為呢筆係用 Petty Cash 畀，唔係直接從儲蓄戶口轉賬

  console.log('\n--- DB vs Bank Statement Analysis ---');
  console.log('DB $50,000 商務餐飲 係用咩方式支付？');
  console.log('如果係 Petty Cash 支付，應該 deduct_from_petty_cash = false');
  console.log('如果係銀行直接轉賬，應該喺 bank statement 出現');
  console.log('\nBank Statement 無呢筆 $50,000 商務餐飲，所以應該係 Petty Cash 支付');
})();
