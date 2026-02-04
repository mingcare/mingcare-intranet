const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Search for 250000
  const { data: d1 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .eq('income_amount', 250000);
  
  console.log('=== $250,000 記錄 ===');
  if (d1?.length) {
    d1.forEach(r => console.log(r.journal_number, r.payment_method, r.income_category, r.transaction_item));
  } else {
    console.log('冇搵到！');
  }
  
  // Search for 13620
  const { data: d2 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .eq('income_amount', 13620);
  
  console.log('\n=== $13,620 記錄 ===');
  if (d2?.length) {
    d2.forEach(r => console.log(r.journal_number, r.payment_method, r.income_category, r.transaction_item));
  } else {
    console.log('冇搵到！');
  }
  
  // Search for 00001578 (Yau cheque)
  const { data: d3 } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001578');
  
  console.log('\n=== 00001578 (邱生支票) ===');
  if (d3?.length) {
    d3.forEach(r => console.log(r.journal_number, r.payment_method, r.income_amount, r.transaction_item));
  } else {
    console.log('冇搵到！');
  }
  
  // All 12月 cheque income
  console.log('\n=== 12月所有支票收入 ===');
  const { data: cheques } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .eq('payment_method', '支票')
    .gt('income_amount', 0);
  
  cheques?.forEach(r => console.log(r.transaction_date, r.journal_number, '$'+r.income_amount, r.transaction_item?.substring(0,40)));
})();
