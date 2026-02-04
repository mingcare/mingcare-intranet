const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function check() {
  // 檢查5月2日的銀行轉賬
  const { data } = await supabase.from('financial_transactions').select('*')
    .eq('transaction_date', '2025-05-02')
    .eq('payment_method', '銀行轉賬')
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  console.log('5月2日銀行轉賬記錄:');
  data.forEach(t => {
    console.log(`${t.journal_number} | ${t.income_category || t.expense_category} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item}`);
  });

  // 檢查內部轉賬類別
  const { data: internal } = await supabase.from('financial_transactions').select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .or('income_category.eq.內部轉帳,expense_category.eq.內部轉帳')
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  console.log('\n5月份內部轉賬記錄:');
  internal.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.payment_method} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item}`);
  });

  // 檢查重複的銀行利息/手續費
  const { data: fees } = await supabase.from('financial_transactions').select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .or('expense_category.eq.銀行手續費,income_category.eq.銀行利息')
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  console.log('\n5月份銀行利息/手續費:');
  fees.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0}`);
  });
}

check();
