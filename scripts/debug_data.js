const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 直接查詢 1698
  const { data: r1698 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001698')
    .single();

  console.log('1698 記錄:', r1698);

  // 查詢 2026 年 1 月現金交易
  const { data: jan } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, payment_method, deduct_from_petty_cash, transaction_item')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-05')
    .eq('payment_method', '現金');

  console.log('\n2026年1月1-5日現金交易:', jan?.length);
  jan?.forEach(t => console.log(t.journal_number, t.transaction_date, t.payment_method, 'deduct:', t.deduct_from_petty_cash, t.transaction_item.substring(0,20)));

  // 查詢調整記錄
  const { data: adj } = await supabase
    .from('financial_transactions')
    .select('*')
    .like('journal_number', 'ADJ%');

  console.log('\n調整記錄:', adj);

  process.exit(0);
})();
