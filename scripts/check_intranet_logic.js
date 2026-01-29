const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 模擬 Intranet 的篩選邏輯
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  // 篩選零用金相關交易 - 和 Intranet 一樣
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash' ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  console.log('零用金交易數:', pettyCashTxns.length);

  // 找 ADJ-0000
  const adj = pettyCashTxns.find(t => t.journal_number === 'ADJ-0000');
  console.log('ADJ-0000 在篩選結果中:', adj ? '是' : '否');
  if (adj) {
    console.log('ADJ-0000:', adj.journal_number, adj.expense_category, adj.expense_amount);
  }

  // 計算到 2025-12 的餘額 (這是 2026 年全年的期初)
  let balance2025 = 0;
  pettyCashTxns.forEach(t => {
    if (t.transaction_date <= '2025-12-31') {
      const isReplenishment = t.expense_category === 'Petty Cash';
      const isAdjustment = t.income_category === '期初調整' || t.expense_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
      
      if (isReplenishment) {
        balance2025 += (t.expense_amount || 0);
      } else if (isAdjustment) {
        balance2025 += (t.income_amount || 0) - (t.expense_amount || 0);
      } else {
        balance2025 += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('\n2025-12-31 結餘 (2026全年期初):', balance2025.toFixed(2));

  // 計算 1698 後的餘額
  let balance1698 = balance2025;
  const jan2026 = pettyCashTxns.filter(t => t.transaction_date >= '2026-01-01');
  
  console.log('\n2026年1月交易:');
  for (const t of jan2026) {
    const isReplenishment = t.expense_category === 'Petty Cash';
    
    if (isReplenishment) {
      balance1698 += (t.expense_amount || 0);
    } else {
      balance1698 += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    if (t.journal_number === '00001698' || t.journal_number === '00001699') {
      console.log(t.journal_number, t.transaction_item, '餘額:', balance1698.toFixed(2));
    }
  }

  process.exit(0);
})();
