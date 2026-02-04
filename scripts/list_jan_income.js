const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 所有 1 月收入 (銀行轉賬 + 支票)
  const { data } = await supabase.from('financial_transactions')
    .select('transaction_date, income_amount, payment_method, transaction_item')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .in('payment_method', ['銀行轉賬', '支票'])
    .gt('income_amount', 0)
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date')
    .order('income_amount', { ascending: false });
  
  console.log('=== 1月份 Intranet 收入記錄 (銀行轉賬+支票) ===\n');
  
  let total = 0;
  data?.forEach(t => {
    total += t.income_amount;
    const method = t.payment_method === '支票' ? '[支票]' : '';
    console.log(`${t.transaction_date} $${t.income_amount.toLocaleString().padStart(10)} ${method} ${t.transaction_item?.substring(0, 40) || ''}`);
  });
  
  console.log('\n總計: $' + total.toLocaleString());
  console.log('銀行帳單: $776,562.18');
  console.log('差額: $' + (776562.18 - total).toFixed(2));
  
  process.exit(0);
})();
