const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// 呢9筆工資係用現金出，現金來自 CHQ-DEC-112 支票提取
// 應該係 deduct_from_petty_cash = true，唔係銀行轉賬
const cashSalaries = [
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
  console.log('將現金出糧改為 deduct_from_petty_cash = true...\n');
  
  for (const jn of cashSalaries) {
    const { data, error } = await supabase.from('financial_transactions')
      .update({ 
        deduct_from_petty_cash: true,
        payment_method: '現金',
        notes: '現金出糧 - 來自 CHQ-DEC-112 支票提取 $57,874'
      })
      .eq('journal_number', jn)
      .select('journal_number, expense_amount, transaction_item');
    
    if (error) {
      console.error('Error:', jn, error);
    } else if (data && data[0]) {
      console.log('✅', jn, '$' + data[0].expense_amount, data[0].transaction_item?.substring(0, 20));
    }
  }
  
  // 計算總數
  const total = 1920 + 7920 + 3300 + 7480 + 16200 + 6270 + 9574 + 3380 + 1830;
  console.log('\n現金出糧總數: $' + total);
  console.log('CHQ-DEC-112 支票提取: $57,874');
  console.log('差額: $' + (57874 - total) + ' (可能有其他現金支出)');
})();
