const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 1. 刪除我加的 ADJ-0000
  await supabase.from('financial_transactions').delete().eq('journal_number', 'ADJ-0000');
  console.log('✅ 已刪除 ADJ-0000');

  // 2. 獲取所有交易（不包含 00001802）
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .neq('journal_number', '00001802')
    .order('transaction_date', { ascending: true });

  // 3. 篩選零用金交易
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬')
  );

  // 4. 計算到 1698 前的餘額（不含 00001802）
  let balanceBefore1698 = 0;
  pettyCashTxns.forEach(t => {
    if (t.transaction_date < '2026-01-02' || 
        (t.transaction_date === '2026-01-02' && t.journal_number < '00001698')) {
      const isReplenishment = t.expense_category === 'Petty Cash';
      if (isReplenishment) {
        balanceBefore1698 += (t.expense_amount || 0);
      } else {
        balanceBefore1698 += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('不含調整的 1698 前餘額:', balanceBefore1698.toFixed(2));

  // 5. 計算需要的調整金額
  // 目標：1698 前餘額 = 1365.10（這樣 1698 扣 329.30 後 = 1035.80）
  const targetBalance = 1365.10;
  const adjustmentNeeded = targetBalance - balanceBefore1698;
  
  console.log('目標 1698 前餘額:', targetBalance.toFixed(2));
  console.log('需要調整金額:', adjustmentNeeded.toFixed(2));

  // 6. 更新 00001802 的金額
  const { error } = await supabase
    .from('financial_transactions')
    .update({ income_amount: adjustmentNeeded })
    .eq('journal_number', '00001802');

  if (error) {
    console.error('更新失敗:', error);
  } else {
    console.log('✅ 已更新 00001802 金額為:', adjustmentNeeded.toFixed(2));
  }

  // 7. 驗證
  const { data: verify } = await supabase
    .from('financial_transactions')
    .select('journal_number, income_amount')
    .eq('journal_number', '00001802')
    .single();
  console.log('\n驗證 00001802:', verify);

  process.exit(0);
})();
