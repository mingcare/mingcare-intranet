const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, payment_method, deduct_from_petty_cash, transaction_item')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .eq('payment_method', '銀行轉賬')
    .gt('income_amount', 0);
  
  console.log('=== 1月份銀行轉賬收入詳細 ===\n');
  
  let pettyTotal = 0, nonPettyTotal = 0;
  
  data?.forEach(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const marker = isPetty ? '[PC]' : '';
    console.log(`$${t.income_amount.toLocaleString().padStart(10)} ${marker.padEnd(5)} ${t.transaction_item?.substring(0, 40) || ''}`);
    
    if (isPetty) {
      pettyTotal += t.income_amount;
    } else {
      nonPettyTotal += t.income_amount;
    }
  });
  
  console.log('\n--- 小計 ---');
  console.log('Petty Cash: $' + pettyTotal.toLocaleString());
  console.log('儲蓄戶口:   $' + nonPettyTotal.toLocaleString());
  console.log('Total:      $' + (pettyTotal + nonPettyTotal).toLocaleString());
  
  process.exit(0);
})();
