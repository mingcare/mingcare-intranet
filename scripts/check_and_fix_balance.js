const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取所有零用金交易
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  // 排序
  pettyCashTxns.sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date.localeCompare(b.transaction_date);
    }
    return (a.journal_number || '').localeCompare(b.journal_number || '');
  });

  // 計算當前最終餘額
  let currentBalance = 0;
  for (const t of pettyCashTxns) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    if (isReplenishment) {
      currentBalance += (t.expense_amount || 0);
    } else {
      currentBalance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
  }

  console.log('當前最終餘額:', currentBalance.toFixed(2));
  console.log('目標餘額: 1802.49');
  
  const targetBalance = 1802.49;
  const adjustmentNeeded = targetBalance - currentBalance;
  console.log('需要調整金額:', adjustmentNeeded.toFixed(2));

  // 查找現有的調整記錄 00001802
  const { data: existing } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001802')
    .single();

  if (existing) {
    console.log('\n現有 00001802 調整記錄:');
    console.log('  收入:', existing.income_amount);
    
    // 計算新的調整金額
    const newAdjustment = (existing.income_amount || 0) + adjustmentNeeded;
    console.log('  新調整金額:', newAdjustment.toFixed(2));

    // 更新
    const { error } = await supabase
      .from('financial_transactions')
      .update({ income_amount: newAdjustment })
      .eq('journal_number', '00001802');

    if (error) {
      console.error('更新失敗:', error);
    } else {
      console.log('\n✅ 已更新 00001802 金額為:', newAdjustment.toFixed(2));
    }
  }

  // 驗證
  const { data: allData2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCashTxns2 = allData2.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  let newBalance = 0;
  for (const t of pettyCashTxns2) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    if (isReplenishment) {
      newBalance += (t.expense_amount || 0);
    } else {
      newBalance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
  }

  console.log('\n✅ 更新後最終餘額:', newBalance.toFixed(2));

  process.exit(0);
})();
