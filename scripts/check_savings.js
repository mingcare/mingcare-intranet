const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function check() {
  const { data } = await supabase.from('financial_transactions').select('*')
    .gte('transaction_date', '2025-04-01').lte('transaction_date', '2025-04-30')
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  // Same filter as intranet savings view
  const savings = data.filter(t => {
    const pm = (t.payment_method || '').trim();
    const isCash = pm === '現金';
    const isLedger = pm === '銀行轉賬' || pm === '支票' || !pm || (isCash && t.deduct_from_petty_cash === false);
    if (!isLedger) return false;
    if (pm === '支票') return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    return true;
  });

  console.log('=== Non-銀行轉賬 transactions in 儲蓄戶口 view ===');
  savings.filter(t => t.payment_method !== '銀行轉賬').forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.payment_method || '(空白)'} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item}`);
  });
  
  const inc = savings.reduce((s,t) => s + (t.income_amount || 0), 0);
  const exp = savings.reduce((s,t) => s + (t.expense_amount || 0), 0);
  console.log('\n=== Balance ===');
  console.log('Intranet 儲蓄戶口 balance:', (82755.59 + inc - exp).toFixed(2));
  console.log('Bank statement: $103,530.96');
  console.log('Difference:', (82755.59 + inc - exp - 103530.96).toFixed(2));
}

check();
