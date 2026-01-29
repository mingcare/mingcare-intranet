const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 查看 1698 相關記錄
  const { data: r1698 } = await supabase
    .from('financial_transactions')
    .select('*')
    .like('journal_number', '%1698%');
  console.log('1698 相關記錄:', r1698);
  
  // 查看 2026 年 1-2 月的記錄
  const { data: y2026 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, payment_method, deduct_from_petty_cash')
    .gte('transaction_date', '2026-01-01')
    .order('transaction_date', { ascending: false })
    .limit(80);
  
  console.log('\n2026年記錄 (' + (y2026 ? y2026.length : 0) + '筆):');
  if (y2026) {
    y2026.forEach(r => console.log(
      r.journal_number, 
      r.transaction_date, 
      r.transaction_item.substring(0, 30), 
      '支出:', r.expense_amount, 
      '收入:', r.income_amount, 
      'Petty:', r.deduct_from_petty_cash
    ));
  }
  
  // 查看最新流水號
  const { data: seq } = await supabase
    .from('global_journal_sequence')
    .select('*')
    .single();
  console.log('\n流水號序列:', seq);
  
  process.exit(0);
})();
