const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Fix November Cheques ===\n');
  
  // 1. 00001464: 改 payment_method 做 "現金"
  const { data: fix1 } = await supabase.from('financial_transactions')
    .update({ payment_method: '現金' })
    .eq('journal_number', '00001464')
    .select('journal_number, payment_method, expense_amount');
  console.log('✅ 00001464:', fix1);
  
  // 2. 00001461: 改 payment_method 做 "現金"
  const { data: fix2 } = await supabase.from('financial_transactions')
    .update({ payment_method: '現金' })
    .eq('journal_number', '00001461')
    .select('journal_number, payment_method, expense_amount');
  console.log('✅ 00001461:', fix2);
  
  // 3. 1465A + 00001465: 移去12月 (支票喺11月未兌現)
  const { data: fix3 } = await supabase.from('financial_transactions')
    .update({ transaction_date: '2025-12-01' })
    .in('journal_number', ['1465A', '00001465'])
    .select('journal_number, transaction_date, expense_amount');
  console.log('✅ Moved to Dec:', fix3);
  
  // Verify
  console.log('\n=== Verification ===');
  
  const BANK = {
    savings: { opening: 43197.51, closing: 14923.59 },
    current: { opening: 3332.04, closing: 20987.04 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  // Savings
  const savingsTxns = txns.filter(t => t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true);
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => { savingsInc += t.income_amount || 0; savingsExp += t.expense_amount || 0; });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Income:', savingsInc.toFixed(2), '(Bank: 385,700.29)');
  console.log('  Expense:', savingsExp.toFixed(2), '(Bank: 413,974.21)');
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Diff:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // Current
  const currentTxns = txns.filter(t => t.payment_method === '支票');
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => { currentInc += t.income_amount || 0; currentExp += t.expense_amount || 0; });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Income:', currentInc, '(Bank: 78,268)');
  console.log('  Expense:', currentExp, '(Bank: 60,613)');
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Diff:', (BANK.current.closing - currentClosing).toFixed(2));
  
  // List remaining cheques
  console.log('\n📋 Remaining cheques in Nov:');
  currentTxns.filter(t => t.expense_amount > 0).forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | $${t.expense_amount}`);
  });
})();
