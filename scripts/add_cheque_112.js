const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Add missing cheque #112 $57,874
  // This appears to be a November salary cheque cashed in December
  const { data, error } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'CHQ-DEC-112',
      transaction_date: '2025-12-09',
      billing_month: '2025年12月',
      transaction_item: '支票 #112 (11月份工資)',
      payment_method: '支票',
      expense_amount: 57874,
      expense_category: '護理人員工資',
      income_amount: 0,
      notes: '支票 #112',
      fiscal_year: 2025,
      deduct_from_petty_cash: false
    })
    .select();
  
  if (error) { console.error(error); return; }
  console.log('✅ Added CHQ-DEC-112:', data);
})();
