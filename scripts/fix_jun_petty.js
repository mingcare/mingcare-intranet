const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  // 更新6月所有現金支出為 deduct_from_petty_cash = true
  // 排除 Petty Cash 補充（那些是銀行轉賬）
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ deduct_from_petty_cash: true })
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '現金')
    .neq('expense_category', 'Petty Cash')
    .select('journal_number');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('已更新', data.length, '筆6月現金交易為 deduct_from_petty_cash = true');
  
  // 驗證
  const { data: verify } = await supabase
    .from('financial_transactions')
    .select('journal_number, deduct_from_petty_cash')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '現金')
    .eq('deduct_from_petty_cash', true);
    
  console.log('驗證：6月現金交易 deduct=true 數量:', verify?.length);
})();
