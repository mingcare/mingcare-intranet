const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function fix() {
  // Update 00000744: set deduct_from_petty_cash = true
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ deduct_from_petty_cash: true })
    .eq('journal_number', '00000744')
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Updated 00000744: deduct_from_petty_cash = true');
  console.log('Record:', data);

  // Verify savings balance
  const { data: aprData } = await supabase.from('financial_transactions').select('*')
    .gte('transaction_date', '2025-04-01').lte('transaction_date', '2025-04-30')
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  const savings = aprData.filter(t => {
    const pm = (t.payment_method || '').trim();
    const isCash = pm === '現金';
    const isLedger = pm === '銀行轉賬' || pm === '支票' || !pm || (isCash && t.deduct_from_petty_cash === false);
    if (!isLedger) return false;
    if (pm === '支票') return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    return true;
  });

  const inc = savings.reduce((s,t) => s + (t.income_amount || 0), 0);
  const exp = savings.reduce((s,t) => s + (t.expense_amount || 0), 0);
  
  console.log('\n=== Verification ===');
  console.log('Intranet 儲蓄戶口 balance:', (82755.59 + inc - exp).toFixed(2));
  console.log('Bank statement: $103,530.96');
  console.log('Difference:', (82755.59 + inc - exp - 103530.96).toFixed(2));
  
  if (Math.abs(82755.59 + inc - exp - 103530.96) < 0.01) {
    console.log('\n✅ PERFECT MATCH!');
  }
}

fix();
