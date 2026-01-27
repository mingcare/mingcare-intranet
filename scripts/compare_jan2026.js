const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function compare() {
  // 獲取2026年1月所有零用金交易
  const { data } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true });

  // 篩選零用金交易
  const pettyCash = data.filter(t => {
    const isAdj = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
    return !isAdj && (
      (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
      t.expense_category === 'Petty Cash'
    );
  });

  // 計算餘額，從 1035.80 開始（第一筆交易後的餘額）
  let balance = 1035.80;
  
  console.log('2026年1月零用金計算：');
  console.log('日期\t\t餘額\t\t補充\t\t支出\t\t項目');
  console.log('─'.repeat(80));
  
  // 第一筆之後的交易
  pettyCash.forEach((t, i) => {
    if (i === 0) {
      console.log(t.transaction_date + '\t' + balance.toFixed(2) + '\t\t\t\t' + (t.expense_amount || 0) + '\t\t' + t.transaction_item + ' (' + t.journal_number + ')');
      return;
    }
    
    const isReplenishment = t.expense_category === 'Petty Cash';
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
      console.log(t.transaction_date + '\t' + balance.toFixed(2) + '\t\t' + t.expense_amount + '\t\t\t\t' + t.transaction_item + ' (' + t.journal_number + ')');
    } else {
      balance -= (t.expense_amount || 0);
      balance += (t.income_amount || 0);
      console.log(t.transaction_date + '\t' + balance.toFixed(2) + '\t\t\t\t' + (t.expense_amount || 0) + '\t\t' + t.transaction_item + ' (' + t.journal_number + ')');
    }
  });
  
  console.log('\n最終餘額:', balance.toFixed(2));
}
compare();
