const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // 查詢 journal_number 為 null 的
  const { data: nullData, error: err1 } = await supabase
    .from('financial_transactions')
    .select('id, journal_number, transaction_code, billing_month, transaction_date, transaction_item, income_amount, expense_amount, payment_method')
    .is('journal_number', null)
    .eq('is_deleted', false);

  // 查詢 journal_number 為空字串的
  const { data: emptyData, error: err2 } = await supabase
    .from('financial_transactions')
    .select('id, journal_number, transaction_code, billing_month, transaction_date, transaction_item, income_amount, expense_amount, payment_method')
    .eq('journal_number', '')
    .eq('is_deleted', false);

  if (err1) console.error('錯誤1:', err1);
  if (err2) console.error('錯誤2:', err2);

  const allMissing = [...(nullData || []), ...(emptyData || [])];

  console.log('=== 沒有流水號的交易記錄 ===');
  console.log('journal_number 為 null:', nullData?.length || 0, '筆');
  console.log('journal_number 為空字串:', emptyData?.length || 0, '筆');
  console.log('總數:', allMissing.length, '筆\n');

  if (allMissing.length === 0) {
    console.log('✅ 所有交易都有流水號！');
  } else {
    allMissing.forEach((t, i) => {
      console.log(`[${i + 1}] ID: ${t.id}`);
      console.log(`    編號: ${t.transaction_code || '無'}`);
      console.log(`    月份: ${t.billing_month}`);
      console.log(`    日期: ${t.transaction_date}`);
      console.log(`    項目: ${t.transaction_item}`);
      console.log(`    收入: $${t.income_amount || 0} | 支出: $${t.expense_amount || 0}`);
      console.log(`    付款方式: ${t.payment_method || '無'}`);
      console.log('');
    });
  }
}

check();
