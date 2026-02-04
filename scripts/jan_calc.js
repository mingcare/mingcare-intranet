const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 所有 1 月銀行轉賬+支票收入
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, payment_method, deduct_from_petty_cash')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .in('payment_method', ['銀行轉賬', '支票'])
    .gt('income_amount', 0);
  
  let total = 0, pettyCount = 0, nonPettyCount = 0;
  data?.forEach(t => {
    if (t.deduct_from_petty_cash === true) {
      pettyCount++;
    } else {
      total += t.income_amount;
      nonPettyCount++;
    }
  });
  
  console.log('Total records:', data?.length);
  console.log('Petty cash records:', pettyCount);
  console.log('Non-petty records:', nonPettyCount);
  console.log('Income total: $' + total.toLocaleString());
  console.log('Bank statement: $776,562.18');
  console.log('Diff: $' + (total - 776562.18).toFixed(2));
  
  process.exit(0);
})();
