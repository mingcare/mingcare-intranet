const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

const PETTY_CASH_OPENING_BALANCE = 1999.89;

(async () => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  if (error) { console.log('Error:', error); return; }

  // 篩選零用金相關交易
  const pettyCashTxns = data.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  // 按月份計算累計餘額
  const monthlyBalance = {};
  let runningBalance = PETTY_CASH_OPENING_BALANCE;

  pettyCashTxns.forEach(t => {
    const txnMonth = t.transaction_date.substring(0, 7);
    const isReplenishment = t.expense_category === 'Petty Cash';
    
    if (isReplenishment) {
      runningBalance += (t.expense_amount || 0);
    } else {
      runningBalance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
    
    monthlyBalance[txnMonth] = runningBalance;
  });

  console.log('=== 零用金月結餘額 ===');
  Object.keys(monthlyBalance).sort().forEach(m => {
    console.log(m + ': HK$' + monthlyBalance[m].toFixed(2));
  });
  
  console.log('');
  console.log('12月期初應為11月結餘:', monthlyBalance['2025-11']?.toFixed(2) || 'N/A');
})();
