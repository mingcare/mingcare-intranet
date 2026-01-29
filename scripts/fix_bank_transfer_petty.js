const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 修正：銀行轉賬交易不應該從零用金扣除
  // 除非是 Petty Cash 補充（expense_category = 'Petty Cash'）
  
  const { data: bankTransfers } = await supabase
    .from('financial_transactions')
    .select('id, journal_number, transaction_item, payment_method, expense_category, deduct_from_petty_cash')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true)
    .neq('expense_category', 'Petty Cash');

  console.log('需要修正的銀行轉賬記錄數:', bankTransfers?.length || 0);

  if (bankTransfers && bankTransfers.length > 0) {
    // 將這些銀行轉賬的 deduct_from_petty_cash 設為 false
    const ids = bankTransfers.map(t => t.id);
    
    const { error } = await supabase
      .from('financial_transactions')
      .update({ deduct_from_petty_cash: false })
      .in('id', ids);

    if (error) {
      console.error('更新失敗:', error);
    } else {
      console.log('✅ 已修正', ids.length, '筆銀行轉賬記錄');
    }
  }

  // 確認 Petty Cash 補充記錄保持 true
  const { data: pettyCashReplenish } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_item, expense_category, deduct_from_petty_cash')
    .eq('expense_category', 'Petty Cash');

  console.log('\nPetty Cash 補充記錄:');
  pettyCashReplenish?.forEach(t => console.log(t.journal_number, t.transaction_item, 'deduct:', t.deduct_from_petty_cash));

  process.exit(0);
})();
