const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // First check if record exists
  const { data: existing } = await supabase.from('financial_transactions')
    .select('*')
    .eq('transaction_date', '2025-04-02')
    .ilike('description', '%Google Workspace%');
  
  console.log('Existing records:', existing?.length || 0);
  if (existing?.length > 0) {
    console.log('Found:', existing[0]);
    
    // Update the petty_cash_balance
    const { data, error } = await supabase.from('financial_transactions')
      .update({ petty_cash_balance: 1802.49 })
      .eq('id', existing[0].id)
      .select();
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('✅ Updated petty_cash_balance to $1802.49');
    }
  } else {
    console.log('Record not found, need to check transaction_id 667 or similar');
  }
})();
