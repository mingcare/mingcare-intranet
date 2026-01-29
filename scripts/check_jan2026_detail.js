const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取2026年1月的所有交易
  const { data: jan2026 } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  console.log('2026年1月交易總數:', jan2026.length);
  
  // 分析每筆交易
  console.log('\n2026年1月交易明細:');
  jan2026.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.payment_method} | deduct_from_petty_cash: ${t.deduct_from_petty_cash} | expense_category: ${t.expense_category} | ${t.transaction_item.substring(0, 30)}`);
  });

  // 篩選零用金交易
  const pettyCashTxns = jan2026.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  console.log('\n符合零用金條件的交易數:', pettyCashTxns.length);
  
  process.exit(0);
})();
