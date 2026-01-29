const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 查看 00001802 調整記錄
  const { data: adj } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001802')
    .single();

  console.log('00001802 調整記錄:');
  console.log('  income_amount:', adj?.income_amount);
  console.log('  income_category:', adj?.income_category);
  console.log('  payment_method:', adj?.payment_method);
  console.log('  deduct_from_petty_cash:', adj?.deduct_from_petty_cash);

  // 獲取所有交易
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  console.log('\n總交易數:', allData.length);

  // 模擬前端的篩選邏輯 (從 page.tsx)
  // 零用金交易: (payment_method === '現金' && deduct_from_petty_cash === true) || 
  //            (expense_category === 'Petty Cash' && payment_method === '銀行轉賬')
  
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.expense_category === '期初調整'
  );

  console.log('零用金交易數 (不含 income_category 調整):', pettyCashTxns.length);

  // 檢查 00001802 是否被包含在零用金交易中
  const adj_in_list = pettyCashTxns.find(t => t.journal_number === '00001802');
  console.log('\n00001802 是否在零用金交易列表中:', !!adj_in_list);

  // 加上 income_category 調整的版本
  const pettyCashTxns2 = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  console.log('零用金交易數 (含 income_category 調整):', pettyCashTxns2.length);

  const adj_in_list2 = pettyCashTxns2.find(t => t.journal_number === '00001802');
  console.log('00001802 是否在列表中:', !!adj_in_list2);

  process.exit(0);
})();
