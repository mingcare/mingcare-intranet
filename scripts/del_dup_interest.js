const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Check for duplicate interest
  const { data } = await supabase.from('financial_transactions')
    .select('id, journal_number')
    .eq('journal_number', 'INT-DEC-2025');
  
  console.log('Found', data.length, 'INT-DEC-2025 records');
  
  if (data.length > 1) {
    // Delete duplicate
    const { error } = await supabase.from('financial_transactions')
      .delete()
      .eq('id', data[1].id);
    
    if (error) console.error(error);
    else console.log('✅ Deleted duplicate INT-DEC-2025');
  }
})();
