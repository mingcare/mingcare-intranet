const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .in('journal_number', ['00001828', '00001829']);

  if (error) { console.error(error); return; }
  
  data.forEach(t => {
    console.log('='.repeat(60));
    console.log('流水號:', t.journal_number);
    console.log('項目:', t.transaction_item);
    console.log('付款方式:', t.payment_method);
    console.log('收入類別:', t.income_category);
    console.log('支出類別:', t.expense_category);
    console.log('收入金額:', t.income_amount);
    console.log('支出金額:', t.expense_amount);
  });
})();
