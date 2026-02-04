const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function analyze() {
  const { data } = await supabase.from('financial_transactions')
    .select('payment_method, deduct_from_petty_cash')
    .gte('transaction_date', '2025-04-01')
    .eq('is_deleted', false);
  
  const stats = {};
  data.forEach(t => {
    const pm = t.payment_method || 'null';
    const deduct = t.deduct_from_petty_cash === true ? 'true' : t.deduct_from_petty_cash === false ? 'false' : 'null';
    const key = pm + ' | ' + deduct;
    stats[key] = (stats[key] || 0) + 1;
  });
  
  console.log('payment_method | deduct | count');
  console.log('---------------|--------|------');
  Object.entries(stats).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => console.log(k + ' | ' + v));
}

analyze().catch(console.error);
