const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function fix() {
  // 1. 修正 556 的日期
  const { error: err1 } = await supabase
    .from('financial_transactions')
    .update({ transaction_date: '2025-03-19' })
    .eq('journal_number', '00000556');
  
  if (err1) {
    console.log('556 更新失敗:', err1.message);
  } else {
    console.log('✅ 556 日期已更新為 2025-03-19');
  }
  
  // 2. 修正 1046(a) 的單號（加空格）
  const { error: err2 } = await supabase
    .from('financial_transactions')
    .update({ journal_number: '1046 (a)' })
    .eq('journal_number', '1046(a)');
  
  if (err2) {
    console.log('1046(a) 更新失敗:', err2.message);
  } else {
    console.log('✅ 1046(a) 已更新為 1046 (a)');
  }
  
  // 驗證
  const { data: r556 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item')
    .eq('journal_number', '00000556')
    .single();
  
  const { data: r1046 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item')
    .eq('journal_number', '1046 (a)')
    .single();
  
  console.log('\n驗證結果:');
  console.log('556:', r556);
  console.log('1046 (a):', r1046);
}

fix();
