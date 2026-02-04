const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .in('payment_method', ['銀行轉賬', '支票'])
    .gt('income_amount', 0)
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date')
    .order('income_amount', { ascending: false });
  
  console.log('=== 完整 1月份收入清單 ===\n');
  
  let bankTotal = 0, chequeTotal = 0;
  data?.forEach(t => {
    const type = t.payment_method === '支票' ? '[支票]' : '[FPS]';
    console.log(`${t.transaction_date} ${type.padEnd(6)} $${t.income_amount.toLocaleString().padStart(10)} ${t.transaction_item?.substring(0, 35) || ''}`);
    if (t.payment_method === '支票') {
      chequeTotal += t.income_amount;
    } else {
      bankTotal += t.income_amount;
    }
  });
  
  console.log('\n--- 小計 ---');
  console.log('銀行轉賬 (FPS): $' + bankTotal.toLocaleString());
  console.log('支票存入:       $' + chequeTotal.toLocaleString());
  console.log('總計:           $' + (bankTotal + chequeTotal).toLocaleString());
  
  console.log('\n銀行帳單: $776,562.18');
  console.log('差額: $' + ((bankTotal + chequeTotal) - 776562.18).toFixed(2));
  
  process.exit(0);
})();
