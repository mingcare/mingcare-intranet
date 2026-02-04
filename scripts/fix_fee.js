const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  // 修改手續費 EX-0026 從 $110 → $100
  console.log('修改銀行手續費 EX-0026...');
  
  // 先查詢確認
  const { data: before, error: queryError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', 'EX-0026')
    .single();

  if (queryError) {
    console.error('找不到 EX-0026:', queryError);
    return;
  }

  console.log('修改前:');
  console.log(`  流水號: ${before.journal_number}`);
  console.log(`  日期: ${before.transaction_date}`);
  console.log(`  支出金額: $${before.expense_amount}`);
  console.log(`  項目: ${before.transaction_item}`);

  // 更新金額 $110 → $100
  const { error: updateError } = await supabase
    .from('financial_transactions')
    .update({ 
      expense_amount: 100,
      updated_by: 'system',
      updated_at: new Date().toISOString()
    })
    .eq('journal_number', 'EX-0026');

  if (updateError) {
    console.error('更新失敗:', updateError);
    return;
  }

  console.log('\n✅ 已修改 EX-0026 銀行手續費: $110 → $100');

  // 確認更新後
  const { data: after } = await supabase
    .from('financial_transactions')
    .select('expense_amount, updated_by, updated_at')
    .eq('journal_number', 'EX-0026')
    .single();

  console.log('\n修改後:');
  console.log(`  支出金額: $${after.expense_amount}`);
  console.log(`  updated_by: ${after.updated_by}`);
  console.log(`  updated_at: ${after.updated_at}`);
}

main().catch(console.error);
