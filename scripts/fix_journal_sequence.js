const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 1. 檢查 global_journal_sequence
  const { data: seq } = await supabase
    .from('global_journal_sequence')
    .select('*');
  console.log('global_journal_sequence:', seq);

  // 2. 找出最大的數字 journal_number
  const { data: allJournals } = await supabase
    .from('financial_transactions')
    .select('journal_number')
    .order('journal_number', { ascending: false })
    .limit(20);

  console.log('\nTop 20 journal_numbers:');
  allJournals.forEach(r => console.log('  ', r.journal_number));

  // 3. 找出最大的純數字 journal_number
  const { data: all } = await supabase
    .from('financial_transactions')
    .select('journal_number');

  const numericOnly = all.filter(r => /^\d+$/.test(r.journal_number));
  const maxNum = Math.max(...numericOnly.map(r => parseInt(r.journal_number, 10)));
  console.log('\nMax numeric journal_number:', maxNum);

  // 4. 修復 global_journal_sequence
  const { error } = await supabase
    .from('global_journal_sequence')
    .update({ last_number: maxNum })
    .eq('id', 1);

  if (error) {
    console.error('Update error:', error);
  } else {
    console.log('\nFixed global_journal_sequence last_number to:', maxNum);
  }

  // 5. 驗證
  const { data: seqAfter } = await supabase
    .from('global_journal_sequence')
    .select('*');
  console.log('\nglobal_journal_sequence after fix:', seqAfter);

  process.exit(0);
})();
