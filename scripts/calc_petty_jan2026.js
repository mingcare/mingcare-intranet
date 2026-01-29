const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取 2026年1月 的現金交易（零用金）
  const { data: jan2026Cash } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('payment_method', '現金')
    .eq('deduct_from_petty_cash', true)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true });

  // 獲取 Petty Cash 補充記錄
  const { data: pettyCashReplenish } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('expense_category', 'Petty Cash')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  console.log('2026年1月現金交易數:', jan2026Cash?.length || 0);
  console.log('2026年1月Petty Cash補充數:', pettyCashReplenish?.length || 0);

  // 合併並按日期排序
  const allPettyTxns = [...(jan2026Cash || []), ...(pettyCashReplenish || [])]
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i) // 去重
    .sort((a, b) => {
      if (a.transaction_date !== b.transaction_date) {
        return a.transaction_date.localeCompare(b.transaction_date);
      }
      return a.journal_number.localeCompare(b.journal_number);
    });

  // 期初餘額 1365.10（根據用戶提供）
  let balance = 1365.10;
  
  console.log('\n2026年1月零用金明細:');
  console.log('期初餘額: HK$' + balance.toFixed(2));
  console.log('-'.repeat(100));
  console.log('單號\t\t日期\t\t項目\t\t\t\t\t補充\t\t支出\t\t餘額');
  console.log('-'.repeat(100));

  allPettyTxns.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    let replenish = 0;
    let expense = 0;

    if (isReplenishment) {
      replenish = t.expense_amount || 0;
      balance += replenish;
    } else {
      replenish = t.income_amount || 0;
      expense = t.expense_amount || 0;
      balance += replenish - expense;
    }

    const item = (t.transaction_item || '').substring(0, 25).padEnd(25);
    console.log(`${t.journal_number}\t${t.transaction_date}\t${item}\t${replenish.toFixed(2).padStart(10)}\t${expense.toFixed(2).padStart(10)}\t${balance.toFixed(2).padStart(10)}`);
  });

  console.log('-'.repeat(100));
  console.log('2026年1月底餘額: HK$' + balance.toFixed(2));

  process.exit(0);
})();
