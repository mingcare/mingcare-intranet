const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Fix 00001363: 徐子喬 $19,680
// - Change deduct_from_petty_cash to false (so it appears in savings)
// - Update date to 2025-10-10 (bank payment date)

(async () => {
  console.log('=== Fixing 00001363 ===\n');
  
  const { error } = await supabase.from('financial_transactions')
    .update({ 
      deduct_from_petty_cash: false,
      transaction_date: '2025-10-10',
      billing_month: '2025年10月',
      notes: 'FPS EBGPP51010015762 Xu ZiQiao - 原支票No.78取消改銀行轉帳'
    })
    .eq('journal_number', '00001363');
  
  if (error) { console.error('Error:', error); return; }
  console.log('✅ Fixed 00001363: deduct=false, date=2025-10-10');
  
  // Verify October
  console.log('\n=== Verifying October 2025 ===');
  
  const BANK = {
    savings: { opening: 180669.99, closing: 43197.51 },
    current: { opening: 1492.04, closing: 3332.04 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31');
  
  // Savings
  const savingsTxns = txns.filter(t => 
    t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true
  );
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Income:', savingsInc);
  console.log('  Expense:', savingsExp);
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Diff:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // Current
  const currentTxns = txns.filter(t => t.payment_method === '支票');
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => {
    currentInc += t.income_amount || 0;
    currentExp += t.expense_amount || 0;
  });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Income:', currentInc);
  console.log('  Expense:', currentExp);
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Diff:', (BANK.current.closing - currentClosing).toFixed(2));
  
  if (Math.abs(BANK.savings.closing - savingsClosing) < 1) {
    console.log('\n✅ 儲蓄戶口 MATCH!');
  }
  if (Math.abs(BANK.current.closing - currentClosing) < 1) {
    console.log('✅ 支票戶口 MATCH!');
  }
})();
