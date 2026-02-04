const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  // 1. 修改 Wong C H 為 petty cash
  const { data: updated, error: err1 } = await supabase.from('financial_transactions')
    .update({ 
      deduct_from_petty_cash: true,
      payment_method: '現金'
    })
    .eq('transaction_date', '2026-01-07')
    .eq('expense_amount', 1500)
    .ilike('transaction_item', '%Wong C H%')
    .select();
  
  if (err1) console.error('Error updating:', err1);
  else console.log('Updated Wong C H:', updated?.length, 'record');

  // 2. 新增 Candy 入 Petty Cash
  const { data: inserted, error: err2 } = await supabase.from('financial_transactions')
    .insert({
      transaction_date: '2026-01-07',
      transaction_item: '股東比現金 Candy to Petty Cash',
      income_amount: 1500,
      income_category: 'Petty Cash',
      payment_method: '現金',
      deduct_from_petty_cash: true,
      fiscal_year: 2026,
      billing_month: '2026年1月'
    })
    .select();
  
  if (err2) console.error('Error inserting:', err2);
  else console.log('Added Candy Petty Cash:', inserted[0]?.transaction_item, '$' + inserted[0]?.income_amount);
})();
