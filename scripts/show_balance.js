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

  // 篩選零用金交易（包含調整記錄）
  const pettyCash = allData.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash === true) ||
    (t.expense_category === 'Petty Cash' && t.payment_method === '銀行轉賬') ||
    t.income_category === '期初調整' ||
    t.expense_category === '期初調整'
  );

  let balance = 0;
  
  console.log('=== 2026年1月零用金餘額 ===\n');
  console.log('單號\t\t日期\t\t項目\t\t\t\t餘額');
  console.log('-'.repeat(70));
  
  pettyCash.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    // 顯示 2026年1月的現金交易
    if (t.transaction_date >= '2026-01-01' && t.transaction_date <= '2026-01-05' && 
        (t.payment_method === '現金' || t.expense_category === 'Petty Cash')) {
      const item = t.transaction_item.substring(0,20).padEnd(20);
      console.log(`${t.journal_number}\t${t.transaction_date}\t${item}\tHK$${balance.toFixed(2)}`);
    }
  });

  process.exit(0);
})();
