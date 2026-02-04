const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Fix November 2025 Savings Discrepancy ===\n');
  
  // 1. Delete IT-NOV-004-IN (doesn't exist in bank - no CR on 20-Nov)
  const { data: deleted, error: delErr } = await supabase.from('financial_transactions')
    .delete()
    .eq('journal_number', 'IT-NOV-004-IN')
    .select();
  
  if (delErr) console.error('Delete error:', delErr);
  else console.log('✅ Deleted IT-NOV-004-IN:', deleted.length, 'record(s)');
  
  // 2. Add missing FPS expense: 24-Nov $7,920 to Cheung Kwun Ho
  // Note: IT-NOV-005-IN is the CR (money coming back from cheque account)
  // But there's also a DR $7,920 FPS going OUT to Cheung Kwun Ho
  const { data: fps, error: fpsErr } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'FPS-NOV-001',
      transaction_date: '2025-11-24',
      billing_month: '2025年11月',
      transaction_item: 'FPS 轉帳 Cheung Kwun Ho',
      payment_method: '銀行轉賬',
      expense_amount: 7920,
      expense_category: '佣金',
      income_amount: 0,
      notes: 'EBGPP51124445867',
      fiscal_year: 2025,
      deduct_from_petty_cash: false
    })
    .select();
  
  if (fpsErr) console.error('FPS error:', fpsErr);
  else console.log('✅ Added FPS-NOV-001: $7,920 to Cheung Kwun Ho');
  
  // 3. Add FPS fee $5 for this transaction
  const { data: fee, error: feeErr } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'FEE-NOV-002',
      transaction_date: '2025-11-24',
      billing_month: '2025年11月',
      transaction_item: 'FPS 手續費',
      payment_method: '銀行轉賬',
      expense_amount: 5,
      expense_category: '銀行手續費',
      income_amount: 0,
      notes: 'FPS FEE for EBGPP51124445867',
      fiscal_year: 2025,
      deduct_from_petty_cash: false
    })
    .select();
  
  if (feeErr) console.error('Fee error:', feeErr);
  else console.log('✅ Added FEE-NOV-002: $5 FPS fee');
  
  // Verify
  const BANK = {
    savings: { opening: 43197.51, closing: 14923.59, credit: 385700.29, debit: 413974.21 },
    current: { opening: 3332.04, closing: 20987.04, credit: 78268, debit: 60613 }
  };
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  const savings = txns.filter(t => t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true);
  let sInc = 0, sExp = 0;
  savings.forEach(t => { sInc += t.income_amount || 0; sExp += t.expense_amount || 0; });
  const sClose = BANK.savings.opening + sInc - sExp;
  
  console.log('\n🏦 儲蓄戶口 驗證:');
  console.log('  Income:  Intranet', sInc.toFixed(2), '| Bank', BANK.savings.credit, '| Diff', (sInc - BANK.savings.credit).toFixed(2));
  console.log('  Expense: Intranet', sExp.toFixed(2), '| Bank', BANK.savings.debit, '| Diff', (sExp - BANK.savings.debit).toFixed(2));
  console.log('  Closing: Intranet', sClose.toFixed(2), '| Bank', BANK.savings.closing, '| Diff', (sClose - BANK.savings.closing).toFixed(2));
  console.log('  Match:', Math.abs(sClose - BANK.savings.closing) < 1 ? '✅' : '❌');
})();
