const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Check specific records that may not be in bank savings
const toCheck = [
  '00001624', '00001625', '00001626', '00001627', '00001628',
  '00001629', '00001630', '00001631', '00001632', '1563A'
];

(async () => {
  for (const jn of toCheck) {
    const { data } = await supabase.from('financial_transactions')
      .select('*')
      .eq('journal_number', jn);
    
    if (data && data[0]) {
      const r = data[0];
      console.log(jn.padEnd(12), '$' + r.expense_amount, 
        'payment:', r.payment_method, 
        'petty:', r.deduct_from_petty_cash,
        r.transaction_item?.substring(0, 30));
    }
  }
})();
