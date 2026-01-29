const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取所有記錄（分頁）
  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data } = await supabase
      .from('financial_transactions')
      .select('journal_number')
      .range(offset, offset + pageSize - 1);
    
    if (!data || data.length === 0) break;
    allRecords = allRecords.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log('Total records fetched:', allRecords.length);

  // 找所有 8 位數開頭的
  const eightDigit = allRecords.filter(r => /^0000\d{4}$/.test(r.journal_number));
  console.log('8-digit (0000XXXX) count:', eightDigit.length);

  // 找最大的
  const nums = eightDigit.map(r => parseInt(r.journal_number, 10));
  const maxNum = Math.max(...nums);
  console.log('Max number:', maxNum);

  // 顯示最大的幾個
  const sorted = eightDigit.sort((a, b) => parseInt(b.journal_number, 10) - parseInt(a.journal_number, 10));
  console.log('\nTop 10:');
  sorted.slice(0, 10).forEach(r => console.log(' ', r.journal_number, '=', parseInt(r.journal_number, 10)));

  // 修復序列
  const { error } = await supabase
    .from('global_journal_sequence')
    .update({ last_number: maxNum })
    .eq('id', 1);
  
  if (!error) {
    console.log('\nFixed last_number to:', maxNum);
    console.log('Next journal_number will be:', String(maxNum + 1).padStart(8, '0'));
  }

  process.exit(0);
})();
