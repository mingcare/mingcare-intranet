const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data, error } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'CHQ-DEC-628',
      transaction_code: 'DEC628',
      fiscal_year: 2025,
      billing_month: '2025年12月',
      transaction_date: '2025-12-31',
      transaction_item: '支票存入 Cheque 000628',
      payment_method: '支票',
      income_category: '服務費',
      income_amount: 13620,
      expense_amount: 0,
      deduct_from_petty_cash: false,
      notes: 'Bank Statement: OUTWARD CLEARING 31-Dec-25'
    })
    .select();
  
  if (error) { console.error(error); return; }
  console.log('✅ Added CHQ-DEC-628: $13,620');
})();
