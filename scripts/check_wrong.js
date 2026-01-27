const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  const { data } = await supabase
    .from('financial_transactions')
    .select('*')
    .in('journal_number', ['00001711', '00001715', '00001705', '00001706'])
    .order('journal_number');

  data.forEach(t => {
    console.log('Journal:', t.journal_number);
    console.log('Item:', t.transaction_item);
    console.log('Payment Method:', t.payment_method);
    console.log('Expense:', t.expense_amount);
    console.log('deduct_from_petty_cash:', t.deduct_from_petty_cash);
    console.log('---');
  });
}
check();
