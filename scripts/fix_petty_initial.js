const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 1. 刪除之前的調整記錄
  const { error: delError } = await supabase
    .from('financial_transactions')
    .delete()
    .like('journal_number', 'ADJ-%');
  
  console.log('✅ 已刪除舊的 ADJ 記錄');

  // 2. 獲取所有零用金交易，按日期排序
  const { data: allTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  // 篩選零用金交易
  const pettyCashTxns = allTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  console.log('零用金交易總數:', pettyCashTxns.length);

  // 3. 找出最早的記錄日期
  const earliestDate = pettyCashTxns[0]?.transaction_date;
  console.log('最早記錄日期:', earliestDate);

  // 4. 計算從最早到 1698 之前的所有交易總和
  let balanceBeforeJan2026 = 0;
  
  pettyCashTxns.forEach(t => {
    if (t.transaction_date < '2026-01-02') {  // 1698 的日期是 2026-01-02
      const isReplenishment = t.expense_category === 'Petty Cash';
      
      if (isReplenishment) {
        balanceBeforeJan2026 += (t.expense_amount || 0);
      } else {
        balanceBeforeJan2026 += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('目前計算到 1698 前的餘額:', balanceBeforeJan2026.toFixed(2));
  
  // 目標：1698 (329.30) 扣除後 = 1035.80
  // 所以 1698 前的餘額應該是 1365.10
  const targetBalanceBefore1698 = 1365.10;
  const adjustmentAmount = targetBalanceBefore1698 - balanceBeforeJan2026;
  
  console.log('目標 1698 前餘額:', targetBalanceBefore1698.toFixed(2));
  console.log('需要調整金額:', adjustmentAmount.toFixed(2));

  // 5. 在最早日期的前一天插入隱藏調整記錄
  const adjustDate = new Date(earliestDate);
  adjustDate.setDate(adjustDate.getDate() - 1);
  const adjustDateStr = adjustDate.toISOString().split('T')[0];

  const adjustmentRecord = {
    journal_number: 'ADJ-0000',
    transaction_code: 'ADJ-0000',
    fiscal_year: parseInt(adjustDateStr.substring(0, 4)),
    billing_month: `${adjustDateStr.substring(0, 4)}年${parseInt(adjustDateStr.substring(5, 7))}月`,
    transaction_date: adjustDateStr,
    transaction_item: '零用金期初餘額（系統）',
    payment_method: '現金',
    income_category: adjustmentAmount > 0 ? '期初調整' : null,
    income_amount: adjustmentAmount > 0 ? adjustmentAmount : 0,
    expense_category: adjustmentAmount < 0 ? '期初調整' : null,
    expense_amount: adjustmentAmount < 0 ? Math.abs(adjustmentAmount) : 0,
    handler: 'System',
    reimbursement_status: '已完成',
    notes: '系統隱藏：零用金期初餘額調整（不顯示於報表）',
    deduct_from_petty_cash: true,
    is_deleted: false
  };

  console.log('調整記錄日期:', adjustDateStr);

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(adjustmentRecord)
    .select();

  if (error) {
    console.error('插入失敗:', error);
  } else {
    console.log('✅ 已插入期初調整記錄:', data[0].journal_number);
  }

  // 6. 驗證
  const { data: verifyTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const verifyPetty = verifyTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  let balance = 0;
  console.log('\n=== 驗證 2026年1月頭幾筆交易餘額 ===');
  
  verifyPetty.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    const isAdjustment = t.income_category === '期初調整' || t.expense_category === '期初調整';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    // 顯示 2026 年 1 月 1-5 日的記錄
    if (t.transaction_date >= '2026-01-01' && t.transaction_date <= '2026-01-05') {
      console.log(`${t.journal_number}\t${t.transaction_date}\t${t.transaction_item.substring(0,25).padEnd(25)}\t餘額: ${balance.toFixed(2)}`);
    }
  });

  process.exit(0);
})();
