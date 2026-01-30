const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 需要更新為支票的交易 (根據支票戶口月結單金額對比)
const toUpdateCheque = [
  '00000688', // 馮炎英 3月份工資 $3190 → 支票#56
  '00000686', // 譚遠 3月份工資 $800 → 支票#58
  '00000687', // 劉建群 3月份工資 $5980 → 支票#57
  '00000685', // 戚家威 3月份工資 $700 → 支票#61
];

async function updateToCheque() {
  console.log('=========================================');
  console.log('  更新付款方式為「支票」');
  console.log('=========================================\n');

  for (const journalNo of toUpdateCheque) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ payment_method: '支票' })
      .eq('journal_number', journalNo)
      .select('journal_number, transaction_item, expense_amount, payment_method')
      .single();

    if (error) {
      console.log(`❌ ${journalNo} 更新失敗:`, error.message);
    } else {
      console.log(`✅ ${data.journal_number} | $${data.expense_amount} | ${data.transaction_item} | 付款方式: ${data.payment_method}`);
    }
  }
  
  console.log('\n=========================================');
  console.log('  完成！');
  console.log('=========================================');
}

updateToCheque();
