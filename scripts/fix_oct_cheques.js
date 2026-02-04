const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Fix October 2025 cheque issues
// 1. 00001363: 取消支票改銀行轉帳 → 改 payment_method
// 2. 00001365: 跨月支票 #84 → 移去 November

(async () => {
  console.log('=== Fixing October 2025 Cheque Issues ===\n');
  
  // Fix 00001363: change payment_method to 銀行轉賬
  const { data: fix1, error: err1 } = await supabase.from('financial_transactions')
    .update({ 
      payment_method: '銀行轉賬',
      notes: '原支票No.78取消，改銀行轉帳付款'
    })
    .eq('journal_number', '00001363')
    .select('journal_number, payment_method');
  
  if (err1) { console.error('Error fixing 00001363:', err1); }
  else { console.log('✅ 00001363: Changed payment_method to 銀行轉賬'); }
  
  // Fix 00001365: move to November (cheque #84 cashed in Nov)
  const { data: fix2, error: err2 } = await supabase.from('financial_transactions')
    .update({ 
      transaction_date: '2025-11-13',  // Based on Nov bank statement
      billing_month: '2025年11月',
      notes: '支票#84 - 10月開票，11月兌現'
    })
    .eq('journal_number', '00001365')
    .select('journal_number, transaction_date');
  
  if (err2) { console.error('Error fixing 00001365:', err2); }
  else { console.log('✅ 00001365: Moved to November 2025'); }
  
  // Verify October 2025
  console.log('\n=== Verifying October 2025 ===');
  
  const BANK = {
    savings: { opening: 180669.99, closing: 43197.51, credit: 313467.79, debit: 450940.27 },
    current: { opening: 1492.04, closing: 3332.04, credit: 74680, debit: 72840 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .eq('deduct_from_petty_cash', false);
  
  // Savings
  const savingsTxns = txns.filter(t => t.payment_method === '銀行轉賬');
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('\n🏦 儲蓄戶口:');
  console.log('  Opening:', BANK.savings.opening);
  console.log('  Income:', savingsInc, '(Bank:', BANK.savings.credit, ')');
  console.log('  Expense:', savingsExp, '(Bank:', BANK.savings.debit, ')');
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Difference:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // Current
  const currentTxns = txns.filter(t => 
    t.payment_method === '支票' && 
    ((t.expense_amount || 0) > 0 || t.income_category === '內部轉帳')
  );
  let currentInc = 0, currentExp = 0;
  currentTxns.forEach(t => {
    currentInc += t.income_amount || 0;
    currentExp += t.expense_amount || 0;
  });
  const currentClosing = BANK.current.opening + currentInc - currentExp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Opening:', BANK.current.opening);
  console.log('  Income:', currentInc, '(Bank:', BANK.current.credit, ')');
  console.log('  Expense:', currentExp, '(Bank:', BANK.current.debit, ')');
  console.log('  Intranet Closing:', currentClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.current.closing);
  console.log('  Difference:', (BANK.current.closing - currentClosing).toFixed(2));
  
  if (Math.abs(BANK.savings.closing - savingsClosing) < 1) {
    console.log('\n✅ 儲蓄戶口 MATCH!');
  }
  if (Math.abs(BANK.current.closing - currentClosing) < 1) {
    console.log('✅ 支票戶口 MATCH!');
  }
})();
