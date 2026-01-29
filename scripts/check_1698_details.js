const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 直接找 1698
  const { data: r1698 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001698')
    .single();
  
  console.log('Record 1698:', JSON.stringify(r1698, null, 2));
  
  // 檢查 deduct_from_petty_cash
  console.log('\ndeduct_from_petty_cash:', r1698?.deduct_from_petty_cash);
  console.log('payment_method:', r1698?.payment_method);

  process.exit(0);
})();
