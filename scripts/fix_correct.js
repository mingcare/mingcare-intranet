const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 1. 先刪除現有的調整記錄
  await supabase.from('financial_transactions').delete().like('journal_number', 'ADJ%');
  console.log('✅ 已刪除舊調整記錄');

  // 2. 獲取所有交易
  let allData = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('transaction_date', { ascending: true })
      .order('journal_number', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (data) allData = [...allData, ...data];
    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  // 3. 正確的零用金篩選：只算現金 + Petty Cash 補充
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬')  // 銀行轉帳的 Petty Cash 補充
  );

  console.log('零用金交易數:', pettyCashTxns.length);

  // 4. 計算到 1698 前的餘額
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

  console.log('目前 1698 前餘額:', balanceBefore1698.toFixed(2));
  
  // 目標：1698 (329.30) 扣除後 = 1035.80
  // 所以 1698 前的餘額應該是 1365.10
  const targetBalance = 1365.10;
  const adjustmentAmount = targetBalance - balanceBefore1698;
  
  console.log('目標 1698 前餘額:', targetBalance.toFixed(2));
  console.log('需要調整金額:', adjustmentAmount.toFixed(2));

  // 5. 找最早日期
  const earliestDate = pettyCashTxns[0]?.transaction_date || '2024-04-23';
  const adjustDate = new Date(earliestDate);
  adjustDate.setDate(adjustDate.getDate() - 1);
  const adjustDateStr = adjustDate.toISOString().split('T')[0];

  // 6. 插入調整記錄
  const adjustmentRecord = {
    journal_number: 'ADJ-0000',
    transaction_code: 'ADJ-0000',
    fiscal_year: parseInt(adjustDateStr.substring(0, 4)),
    billing_month: `${adjustDateStr.substring(0, 4)}年${parseInt(adjustDateStr.substring(5, 7))}月`,
    transaction_date: adjustDateStr,
    transaction_item: '零用金期初餘額（系統）',
    payment_method: '現金',
    income_category: adjustmentAmount > 0 ? '期初調整' : null,
    income_amount: adjustmentAmount > 0 ? Math.abs(adjustmentAmount) : 0,
    expense_category: adjustmentAmount < 0 ? '期初調整' : null,
    expense_amount: adjustmentAmount < 0 ? Math.abs(adjustmentAmount) : 0,
    handler: 'System',
    notes: '系統隱藏：零用金期初餘額調整',
    deduct_from_petty_cash: true,
    is_deleted: false
  };

  const { data: inserted, error } = await supabase
    .from('financial_transactions')
    .insert(adjustmentRecord)
    .select();

  if (error) {
    console.error('插入失敗:', error);
    process.exit(1);
  }
  
  console.log('✅ 已插入調整記錄:', inserted[0].journal_number, '日期:', adjustDateStr, '金額:', adjustmentAmount.toFixed(2));

  // 7. 驗證
  const { data: allData2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true });

  const pettyCash2 = allData2.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  let balance = 0;
  console.log('\n=== 驗證 ===');
  
  pettyCash2.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    const isAdjustment = t.income_category === '期初調整' || t.expense_category === '期初調整';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    if (t.journal_number === '00001698' || t.journal_number === '00001699') {
      console.log(`${t.journal_number} ${t.transaction_item}: 餘額 HK$${balance.toFixed(2)}`);
    }
  });

  process.exit(0);
})();
