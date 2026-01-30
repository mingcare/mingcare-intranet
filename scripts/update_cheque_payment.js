const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function updateChequePaymentMethod() {
  // 查找交易項目包含"支票"但付款方式是銀行轉賬的記錄
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, journal_number, transaction_date, transaction_item, payment_method, expense_amount')
    .ilike('transaction_item', '%支票%')
    .eq('payment_method', '銀行轉賬');

  if (error) {
    console.error('查詢錯誤:', error);
    return;
  }

  console.log('找到需要更新的記錄:', data.length, '筆\n');
  
  if (data.length === 0) {
    console.log('沒有需要更新的記錄');
    return;
  }

  // 顯示找到的記錄
  data.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | $${t.expense_amount} | ${t.transaction_item}`);
  });

  // 更新付款方式為支票
  const ids = data.map(t => t.id);
  const { error: updateError } = await supabase
    .from('financial_transactions')
    .update({ payment_method: '支票' })
    .in('id', ids);

  if (updateError) {
    console.error('更新錯誤:', updateError);
    return;
  }

  console.log('\n✅ 已將以上', data.length, '筆記錄的付款方式改為「支票」');
}

updateChequePaymentMethod();
