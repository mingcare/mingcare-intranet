const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 檢查欄位是否存在
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('Available columns:', Object.keys(data[0]));
    console.log('sort_order exists:', 'sort_order' in data[0]);
  } else {
    console.log('No data or error:', error);
  }

  process.exit(0);
})();
