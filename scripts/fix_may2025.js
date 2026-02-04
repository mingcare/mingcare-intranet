const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== 5月份銀行利息/手續費記錄 ===\n');
  
  const { data: feeRecords } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .or('income_category.eq.銀行利息,expense_category.eq.銀行手續費')
    .eq('is_deleted', false)
    .order('journal_number');
  
  console.log('找到嘅記錄:');
  feeRecords.forEach(r => {
    console.log(`${r.journal_number} | ${r.transaction_date} | ${r.transaction_item}`);
    console.log(`  Income: $${r.income_amount} | Expense: $${r.expense_amount}`);
  });
  
  console.log('\n--- 分析 ---');
  const interests = feeRecords.filter(r => r.income_category === '銀行利息');
  const fees = feeRecords.filter(r => r.expense_category === '銀行手續費');
  
  console.log(`銀行利息記錄: ${interests.length} 條`);
  interests.forEach(r => console.log(`  ${r.journal_number}: $${r.income_amount}`));
  
  console.log(`銀行手續費記錄: ${fees.length} 條`);
  fees.forEach(r => console.log(`  ${r.journal_number}: $${r.expense_amount}`));
  
  // 根據銀行 statement：利息 $6.57，手續費 $135
  // 需要刪除重複：EX-0030 ($135 手續費), EX-0031 ($6.57 利息)
  
  console.log('\n=== 要刪除嘅重複記錄 ===');
  console.log('EX-0030: 重複手續費 $135');
  console.log('EX-0031: 重複利息 $6.57');
  
  // 執行刪除（軟刪除）
  const toDelete = ['EX-0030', 'EX-0031'];
  
  for (const jn of toDelete) {
    const { data, error } = await supabase.from('financial_transactions')
      .update({ 
        is_deleted: true,
        deleted_by: 'System - Bank Statement Reconciliation',
        deleted_at: new Date().toISOString()
      })
      .eq('journal_number', jn)
      .select('journal_number, transaction_item');
    
    if (error) {
      console.error(`❌ 刪除 ${jn} 失敗:`, error);
    } else if (data && data.length > 0) {
      console.log(`✅ 已刪除 ${jn}: ${data[0].transaction_item}`);
    } else {
      console.log(`⚠️ ${jn} 未找到`);
    }
  }
  
  console.log('\n=== 驗證刪除後 ===');
  const { data: afterDelete } = await supabase.from('financial_transactions')
    .select('journal_number, income_amount, expense_amount, income_category, expense_category')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .or('income_category.eq.銀行利息,expense_category.eq.銀行手續費')
    .eq('is_deleted', false);
  
  console.log('剩餘記錄:');
  afterDelete.forEach(r => {
    if (r.income_category === '銀行利息') {
      console.log(`  ${r.journal_number}: 銀行利息 $${r.income_amount}`);
    }
    if (r.expense_category === '銀行手續費') {
      console.log(`  ${r.journal_number}: 銀行手續費 $${r.expense_amount}`);
    }
  });
})();
