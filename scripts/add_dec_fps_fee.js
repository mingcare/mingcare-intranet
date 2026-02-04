const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data, error } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'FEE-DEC-2025',
      transaction_code: 'FEEDEC25',
      fiscal_year: 2025,
      billing_month: '2025年12月',
      transaction_date: '2025-12-31',
      transaction_item: '12月份FPS轉帳手續費 (44筆 × $5)',
      payment_method: '銀行轉賬',
      expense_category: '銀行手續費',
      income_amount: 0,
      expense_amount: 220,
      deduct_from_petty_cash: false,
      notes: 'Bank Statement: 44 FPS fees @ $5 each'
    })
    .select();
  
  if (error) { console.error(error); return; }
  console.log('✅ Added FEE-DEC-2025: $220 FPS手續費');
})();
