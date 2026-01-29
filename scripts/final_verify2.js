const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取所有交易
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

  // 正確的零用金篩選邏輯：
  // 1. 現金交易 + deduct_from_petty_cash = true
  // 2. expense_category = 'Petty Cash' (補充)
  const pettyCashTxns = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    t.expense_category === 'Petty Cash' ||
    t.expense_category === '期初調整' ||
    t.income_category === '期初調整'
  );

  console.log('總交易數:', allData.length);
  console.log('零用金交易數:', pettyCashTxns.length);

  // 檢查付款方式分佈
  const cashOnly = pettyCashTxns.filter(t => t.payment_method === '現金');
  const bankOnly = pettyCashTxns.filter(t => t.payment_method === '銀行轉賬');
  console.log('現金交易:', cashOnly.length);
  console.log('銀行轉賬:', bankOnly.length);

  let balance = 0;
  
  console.log('\n=== 2026年1月零用金交易餘額 ===\n');
  
  pettyCashTxns.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    const isAdjustment = t.expense_category === '期初調整' || t.income_category === '期初調整';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    // 顯示 2026-01 前幾筆
    if (t.transaction_date >= '2026-01-01' && t.transaction_date <= '2026-01-03') {
      console.log(`${t.journal_number}\t${t.transaction_date}\t${t.transaction_item.substring(0,25).padEnd(25)}\t餘額: HK$${balance.toFixed(2)}`);
    }
  });

  process.exit(0);
})();
