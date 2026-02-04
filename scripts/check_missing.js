const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 檢查遺漏嘅交易
  const missing = ['00000765', '00000685', '00000686', '00000687'];
  
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, payment_method, expense_amount, is_deleted')
    .in('journal_number', missing);
  
  console.log('=== 檢查遺漏交易嘅 payment_method ===\n');
  data.forEach(r => {
    console.log(`${r.journal_number} | payment_method: "${r.payment_method}" | is_deleted: ${r.is_deleted} | Exp:$${r.expense_amount}`);
  });
})();
