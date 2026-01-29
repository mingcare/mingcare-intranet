const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 1. 先把 00001802 的 deduct_from_petty_cash 設為 false，payment_method 改為非現金
  //    這樣它只會通過 income_category = '期初調整' 被識別
  await supabase
    .from('financial_transactions')
    .update({ 
      deduct_from_petty_cash: false,
      payment_method: null,
      income_amount: 0  // 先設為 0
    })
    .eq('journal_number', '00001802');
  
  console.log('已重置 00001802');

  // 2. 獲取所有交易，模擬前端邏輯計算當前餘額
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  // 前端篩選邏輯
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash' ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  // 按日期排序
  pettyCashTxns.sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date.localeCompare(b.transaction_date);
    }
    return (a.journal_number || '').localeCompare(b.journal_number || '');
  });

  // 計算當前餘額（00001802 的 income_amount 已經是 0）
  let currentBalance = 0;
  for (const t of pettyCashTxns) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    const isAdjustment = t.income_category === '期初調整' || t.expense_category === '期初調整';
    
    if (isReplenishment) {
      currentBalance += (t.expense_amount || 0);
    } else {
      currentBalance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
  }

  console.log('當前餘額（調整前）:', currentBalance.toFixed(2));
  
  const targetBalance = 1802.49;
  const adjustmentNeeded = targetBalance - currentBalance;
  
  console.log('目標餘額:', targetBalance);
  console.log('需要的調整金額:', adjustmentNeeded.toFixed(2));

  // 3. 更新 00001802 的 income_amount
  const { error } = await supabase
    .from('financial_transactions')
    .update({ income_amount: adjustmentNeeded })
    .eq('journal_number', '00001802');

  if (error) {
    console.error('更新失敗:', error);
  } else {
    console.log('\n✅ 已更新 00001802 income_amount 為:', adjustmentNeeded.toFixed(2));
  }

  // 4. 驗證最終餘額
  const { data: allData2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCashTxns2 = allData2.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash' ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  let finalBalance = 0;
  for (const t of pettyCashTxns2) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    if (isReplenishment) {
      finalBalance += (t.expense_amount || 0);
    } else {
      finalBalance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
  }

  console.log('\n✅ 最終餘額:', finalBalance.toFixed(2));

  // 驗證 00001802 的設置
  const { data: verify } = await supabase
    .from('financial_transactions')
    .select('journal_number, income_amount, income_category, payment_method, deduct_from_petty_cash')
    .eq('journal_number', '00001802')
    .single();
  
  console.log('\n00001802 最終設置:', JSON.stringify(verify, null, 2));

  process.exit(0);
})();
