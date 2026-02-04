const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  // 刪除重複的 AIA $75 (00001827)
  console.log('刪除重複的 AIA 交易 00001827...');
  
  // 先查詢確認
  const { data: before, error: queryError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001827')
    .single();

  if (queryError) {
    console.error('找不到 00001827:', queryError);
    return;
  }

  console.log('找到記錄:');
  console.log(`  流水號: ${before.journal_number}`);
  console.log(`  日期: ${before.transaction_date}`);
  console.log(`  金額: $${before.expense_amount}`);
  console.log(`  項目: ${before.transaction_item}`);
  console.log(`  is_deleted: ${before.is_deleted}`);

  // Soft delete (設 is_deleted = true)
  const { error: updateError } = await supabase
    .from('financial_transactions')
    .update({ 
      is_deleted: true,
      deleted_by: 'system',
      deleted_at: new Date().toISOString()
    })
    .eq('journal_number', '00001827');

  if (updateError) {
    console.error('刪除失敗:', updateError);
    return;
  }

  console.log('\n✅ 已刪除 00001827 (AIA $75 重複)');

  // 確認刪除後
  const { data: after } = await supabase
    .from('financial_transactions')
    .select('is_deleted, deleted_by, deleted_at')
    .eq('journal_number', '00001827')
    .single();

  console.log('\n刪除後狀態:');
  console.log(`  is_deleted: ${after.is_deleted}`);
  console.log(`  deleted_by: ${after.deleted_by}`);
  console.log(`  deleted_at: ${after.deleted_at}`);
}

main().catch(console.error);
