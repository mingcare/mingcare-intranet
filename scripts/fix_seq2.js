const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 找 00001802 調整記錄
  const { data: adj1802 } = await supabase
    .from('financial_transactions')
    .select('journal_number')
    .eq('journal_number', '00001802');
  console.log('00001802 exists:', adj1802);

  // 找所有 8 位數的 journal_number
  const { data: all } = await supabase
    .from('financial_transactions')
    .select('journal_number');

  const eightDigit = all.filter(r => /^\d{8}$/.test(r.journal_number));
  console.log('\n8-digit journal_numbers count:', eightDigit.length);
  
  if (eightDigit.length > 0) {
    const maxEight = Math.max(...eightDigit.map(r => parseInt(r.journal_number, 10)));
    console.log('Max 8-digit:', maxEight);
    
    // 修復
    const { error } = await supabase
      .from('global_journal_sequence')
      .update({ last_number: maxEight })
      .eq('id', 1);
    
    if (!error) {
      console.log('\nFixed to:', maxEight);
    }
  }

  // 總記錄數
  console.log('\nTotal records:', all.length);

  process.exit(0);
})();
