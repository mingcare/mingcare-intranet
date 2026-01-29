const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 先計算目前系統的 2025年12月底餘額
  const { data: allTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCashTxns = allTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  let currentBalance = 0;
  pettyCashTxns.forEach(t => {
    if (t.transaction_date < '2026-01-01') {
      const isReplenishment = t.expense_category === 'Petty Cash';
      const isAdjustment = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
      
      if (isReplenishment) {
        currentBalance += (t.expense_amount || 0);
      } else if (isAdjustment) {
        currentBalance += (t.income_amount || 0);
      } else {
        currentBalance += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('目前系統計算的 2025年12月底餘額:', currentBalance.toFixed(2));
  
  // 需要的期初餘額是 1365.10（這樣 1698 扣除 329.30 後 = 1035.80）
  const targetBalance = 1365.10;
  const adjustmentAmount = targetBalance - currentBalance;
  
  console.log('需要的期初餘額:', targetBalance.toFixed(2));
  console.log('需要調整金額:', adjustmentAmount.toFixed(2));

  // 插入期初調整記錄
  const adjustmentRecord = {
    journal_number: 'ADJ-2026-01',
    transaction_code: 'ADJ-2026-01',
    fiscal_year: 2026,
    billing_month: '2026年1月',
    transaction_date: '2026-01-01',
    transaction_item: '2026年1月期初零用金餘額調整',
    payment_method: '現金',
    income_category: '期初調整',
    income_amount: adjustmentAmount > 0 ? adjustmentAmount : 0,
    expense_category: null,
    expense_amount: adjustmentAmount < 0 ? Math.abs(adjustmentAmount) : 0,
    handler: 'System',
    reimbursement_status: '已完成',
    notes: '系統調整：重設零用金期初餘額為 HK$1,365.10',
    deduct_from_petty_cash: true,
    is_deleted: false
  };

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(adjustmentRecord)
    .select();

  if (error) {
    console.error('插入失敗:', error);
  } else {
    console.log('✅ 已插入期初調整記錄:', data[0].journal_number);
  }

  // 驗證
  const { data: verify } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001698')
    .single();

  // 重新計算
  const { data: allTxns2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-02')
    .eq('payment_method', '現金')
    .eq('deduct_from_petty_cash', true)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date')
    .order('journal_number');

  const { data: adj } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', 'ADJ-2026-01')
    .single();

  let newBalance = 0;
  
  // 加入調整
  if (adj) {
    newBalance += (adj.income_amount || 0) - (adj.expense_amount || 0);
  }
  
  console.log('\n驗證 1698 後的餘額:');
  console.log('期初調整後餘額:', newBalance.toFixed(2));
  
  if (allTxns2) {
    allTxns2.forEach(t => {
      if (t.journal_number !== 'ADJ-2026-01') {
        newBalance += (t.income_amount || 0) - (t.expense_amount || 0);
        console.log(`${t.journal_number} ${t.transaction_item}: 餘額 ${newBalance.toFixed(2)}`);
      }
    });
  }

  process.exit(0);
})();
