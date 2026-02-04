const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Add December interest
  const { data, error } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'INT-DEC-2025',
      transaction_code: 'INTDEC25',
      fiscal_year: 2025,
      billing_month: '2025年12月',
      transaction_date: '2025-12-31',
      transaction_item: '12月份儲蓄戶口利息',
      payment_method: '銀行轉賬',
      income_category: '利息',
      income_amount: 9.98,
      expense_amount: 0,
      deduct_from_petty_cash: false,
      notes: 'Bank Statement: INTEREST POSTING 31-Dec-25'
    })
    .select();
  
  if (error) { console.error(error); return; }
  console.log('✅ Added INT-DEC-2025: $9.98 利息');
})();
