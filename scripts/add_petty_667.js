const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  const { data, error } = await supabase.from('financial_transactions').insert({
    transaction_id: 'PETTY-APR-667',
    transaction_date: '2025-04-02',
    expense_category: '廣告及軟件費用',
    description: 'Google Workspace 3月份...',
    expense_amount: 197.40,
    payment_method: '現金',
    deduct_from_petty_cash: true,
    petty_cash_balance: 1802.49
  }).select();
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Added petty cash record:', data[0].transaction_id);
    console.log('   Date:', data[0].transaction_date);
    console.log('   Amount: -$' + data[0].expense_amount);
    console.log('   Balance: $' + data[0].petty_cash_balance);
  }
})();
