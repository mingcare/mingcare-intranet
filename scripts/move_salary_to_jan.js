const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// 呢9筆工資喺銀行1月7日先出，要改 transaction_date
const toMove = [
  '00001624', // 戴汶慧 $1,920
  '00001625', // 譚文慧 $7,920
  '00001626', // 譚容容 $3,300
  '00001627', // 賴佩玲 $7,480
  '00001628', // 夏洪桃 $16,200
  '00001629', // 呂宛芸 $6,270
  '00001630', // 龍鳳琼 $9,574
  '00001631', // 劉建群 $3,380
  '00001632', // 許秀容 $1,830
];

(async () => {
  for (const jn of toMove) {
    const { data, error } = await supabase.from('financial_transactions')
      .update({ 
        transaction_date: '2026-01-07',
        notes: '實際出糧日期係2026-01-07 (原記錄2025-12-08)'
      })
      .eq('journal_number', jn)
      .select('journal_number, expense_amount, transaction_item');
    
    if (error) { console.error(jn, error); continue; }
    console.log('✅ Moved', jn, '$' + data[0].expense_amount, '→ 2026-01-07');
  }
  console.log('\n共移動 9 筆工資記錄去 2026年1月');
})();
