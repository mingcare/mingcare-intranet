const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取所有零用金交易
  const { data: allTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  // 篩選零用金相關交易
  const pettyCashTxns = allTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  console.log('零用金交易總數:', pettyCashTxns.length);

  // 計算累計餘額
  let balance = 0;
  
  // 找出2025年12月的結餘和2026年1月的交易
  const dec2025Txns = pettyCashTxns.filter(t => t.transaction_date.startsWith('2025-12'));
  const jan2026Txns = pettyCashTxns.filter(t => t.transaction_date.startsWith('2026-01'));
  
  // 計算到2025年12月底的餘額
  pettyCashTxns.forEach(t => {
    if (t.transaction_date < '2026-01-01') {
      const isReplenishment = t.expense_category === 'Petty Cash';
      const isAdjustment = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
      
      if (isReplenishment) {
        balance += (t.expense_amount || 0);
      } else if (isAdjustment) {
        balance += (t.income_amount || 0);
      } else {
        balance += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('\n2025年12月底（2026年1月期初）餘額:', balance.toFixed(2));

  // 顯示2026年1月的交易及餘額變化
  console.log('\n2026年1月零用金交易:');
  console.log('日期\t\t單號\t\t項目\t\t\t\t\t\t補充\t\t支出\t\t餘額');
  console.log('-'.repeat(120));
  
  jan2026Txns.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    const isAdjustment = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
    
    let replenish = 0;
    let expense = 0;
    
    if (isReplenishment) {
      replenish = t.expense_amount || 0;
      balance += replenish;
    } else if (isAdjustment) {
      replenish = t.income_amount || 0;
      balance += replenish;
    } else {
      replenish = t.income_amount || 0;
      expense = t.expense_amount || 0;
      balance += replenish - expense;
    }
    
    const item = t.transaction_item.substring(0, 35).padEnd(35);
    console.log(`${t.transaction_date}\t${t.journal_number}\t${item}\t${replenish.toFixed(2).padStart(10)}\t${expense.toFixed(2).padStart(10)}\t${balance.toFixed(2).padStart(10)}`);
  });

  console.log('\n2026年1月底餘額:', balance.toFixed(2));
  
  process.exit(0);
})();
