const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

const BANK = {
  savings: { opening: 43197.51, closing: 14923.59, credit: 385700.29, debit: 413974.21 },
  current: { opening: 3332.04, closing: 20987.04, credit: 78268, debit: 60613 }
};

(async () => {
  console.log('=== November 2025 Reconciliation ===\n');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  // Savings (銀行轉賬)
  const savings = txns.filter(t => t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true);
  let sInc = 0, sExp = 0;
  savings.forEach(t => { sInc += t.income_amount || 0; sExp += t.expense_amount || 0; });
  const sClose = BANK.savings.opening + sInc - sExp;
  
  console.log('🏦 儲蓄戶口 002113176:');
  console.log('  Income:  Intranet', sInc.toFixed(2), '| Bank', BANK.savings.credit, '| Diff', (sInc - BANK.savings.credit).toFixed(2));
  console.log('  Expense: Intranet', sExp.toFixed(2), '| Bank', BANK.savings.debit, '| Diff', (sExp - BANK.savings.debit).toFixed(2));
  console.log('  Closing: Intranet', sClose.toFixed(2), '| Bank', BANK.savings.closing, '| Diff', (sClose - BANK.savings.closing).toFixed(2));
  console.log('  Match:', Math.abs(sClose - BANK.savings.closing) < 1 ? '✅' : '❌');
  
  // Current (支票 + 支票戶口轉帳)
  const current = txns.filter(t => t.payment_method === '支票' || t.payment_method === '支票戶口轉帳');
  let cInc = 0, cExp = 0;
  current.forEach(t => { cInc += t.income_amount || 0; cExp += t.expense_amount || 0; });
  const cClose = BANK.current.opening + cInc - cExp;
  
  console.log('\n📝 支票戶口 002520252:');
  console.log('  Income:  Intranet', cInc, '| Bank', BANK.current.credit, '| Diff', cInc - BANK.current.credit);
  console.log('  Expense: Intranet', cExp, '| Bank', BANK.current.debit, '| Diff', cExp - BANK.current.debit);
  console.log('  Closing: Intranet', cClose.toFixed(2), '| Bank', BANK.current.closing, '| Diff', (cClose - BANK.current.closing).toFixed(2));
  console.log('  Match:', Math.abs(cClose - BANK.current.closing) < 1 ? '✅' : '❌');
})();
