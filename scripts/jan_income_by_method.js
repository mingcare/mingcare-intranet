const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('payment_method, income_amount')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .gt('income_amount', 0);
  
  const byMethod = {};
  data?.forEach(t => {
    const m = t.payment_method || 'null';
    byMethod[m] = (byMethod[m] || 0) + t.income_amount;
  });
  
  console.log('=== 1月份收入按 payment_method ===\n');
  let total = 0;
  Object.entries(byMethod).sort((a,b) => b[1]-a[1]).forEach(([m, v]) => {
    console.log('  ' + m + ': $' + v.toLocaleString());
    total += v;
  });
  console.log('\n總收入: $' + total.toLocaleString());
  console.log('銀行帳單收入: $776,562.18');
  console.log('差額: $' + (776562.18 - total).toLocaleString());
  
  process.exit(0);
})();
