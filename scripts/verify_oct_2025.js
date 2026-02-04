const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// October 2025 Final Verification
const BANK = {
  savings: { opening: 180669.99, closing: 43197.51, credit: 313467.79, debit: 450940.27 },
  current: { opening: 1492.04, closing: 3332.04, credit: 74680, debit: 72840 }
};

(async () => {
  console.log('=== October 2025 Final Verification ===\n');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .order('transaction_date');
  
  // ===== SAVINGS ACCOUNT =====
  // payment_method='銀行轉賬' AND deduct_from_petty_cash != true
  const savingsTxns = txns.filter(t => 
    t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true
  );
  
  let savingsInc = 0, savingsExp = 0;
  savingsTxns.forEach(t => {
    savingsInc += t.income_amount || 0;
    savingsExp += t.expense_amount || 0;
  });
  
  const savingsClosing = BANK.savings.opening + savingsInc - savingsExp;
  
  console.log('🏦 儲蓄戶口:');
  console.log('  Opening:', BANK.savings.opening);
  console.log('  Income:', savingsInc, '(Bank:', BANK.savings.credit, ')');
  console.log('  Expense:', savingsExp, '(Bank:', BANK.savings.debit, ')');
  console.log('  Intranet Closing:', savingsClosing.toFixed(2));
  console.log('  Bank Closing:', BANK.savings.closing);
  console.log('  Difference:', (BANK.savings.closing - savingsClosing).toFixed(2));
  
  // ===== CURRENT ACCOUNT =====
  // payment_method='支票'
  const currentTxns = txns.filter(t => t.payment_method === '支票');
  
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
  
  // Summary
  console.log('\n=== Summary ===');
  if (Math.abs(BANK.savings.closing - savingsClosing) < 1) {
    console.log('✅ 儲蓄戶口 MATCH!');
  } else {
    console.log('❌ 儲蓄戶口 difference:', (BANK.savings.closing - savingsClosing).toFixed(2));
  }
  if (Math.abs(BANK.current.closing - currentClosing) < 1) {
    console.log('✅ 支票戶口 MATCH!');
  } else {
    console.log('❌ 支票戶口 difference:', (BANK.current.closing - currentClosing).toFixed(2));
  }
})();
