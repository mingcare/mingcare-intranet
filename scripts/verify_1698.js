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

  const pettyCashTxns = allTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  let balance = 0;
  
  console.log('=== 1698 前後的餘額 ===\n');
  
  pettyCashTxns.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    // 只顯示 2026-01-02 的記錄
    if (t.transaction_date === '2026-01-02' && t.payment_method === '現金') {
      console.log(`${t.journal_number}\t${t.transaction_item}\t餘額: HK$${balance.toFixed(2)}`);
    }
  });

  process.exit(0);
})();
