const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Fixing November Cheques ===\n');
  
  // 1. 00001464 $13,270 - 取消支票改現金
  // The note says "取消支票No.96,改出現金" - so it should be cash, not cheque
  // But then there's IT-NOV-004 $13,270 反向轉帳 on same day
  // Let me check both records
  
  const { data: r1464 } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001464')
    .single();
  
  console.log('00001464:', r1464.transaction_item);
  console.log('  Amount:', r1464.expense_amount);
  console.log('  Method:', r1464.payment_method);
  console.log('  Notes:', r1464.notes);
  
  // 2. 00001461 $7,920 - 取消支票
  const { data: r1461 } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001461')
    .single();
  
  console.log('\n00001461:', r1461.transaction_item);
  console.log('  Amount:', r1461.expense_amount);
  console.log('  Notes:', r1461.notes);
  
  // Check if we have IT-NOV-004 and IT-NOV-005
  const { data: its } = await supabase.from('financial_transactions')
    .select('*')
    .in('journal_number', ['IT-NOV-004', 'IT-NOV-005']);
  
  console.log('\nInternal Transfers (Reverse):');
  its.forEach(it => {
    console.log(`  ${it.journal_number}: $${it.expense_amount || it.income_amount} - ${it.transaction_item}`);
  });
  
  // 3. Check 1465A and 00001465
  const { data: r1465A } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '1465A')
    .single();
  
  const { data: r1465 } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001465')
    .single();
  
  console.log('\n1465A:', r1465A?.transaction_item);
  console.log('  Amount:', r1465A?.expense_amount);
  
  console.log('\n00001465:', r1465?.transaction_item);
  console.log('  Amount:', r1465?.expense_amount);
  
  // Analysis:
  // 00001464: 改出現金 -> IT-NOV-004 係反向轉帳 $13,270，呢個應該係另一個人
  // 但描述話係「夏洪桃 10月份工資」，同 IT-NOV-004 反向轉帳唔同
  // 所以 00001464 應該 payment_method 改做 '現金'
  
  // 00001461: 「取消支票No.92,取消支票N...」 同時 IT-NOV-005 反向 $7,920
  // 呢個可能係同一筆錢：原本出支票俾賴佩玲，後來取消支票，錢轉返入儲蓄戶口
  // 所以 00001461 係真嘅支出，IT-NOV-005 係錢返入銀行
  // 兩個都要保留，但 00001461 應該唔係 11月嘅支票戶口支出，因為支票取消咗
  
  console.log('\n\n=== SOLUTION ===');
  console.log('1. 00001464: 改 payment_method 做 "現金" (取消支票改現金)');
  console.log('2. 00001461: 支票取消，錢已經轉返儲蓄戶口 (IT-NOV-005-IN)');
  console.log('   - 需要將 00001461 改為 payment_method = "銀行轉賬" (因為係經銀行支出)');
  console.log('   - 或者刪除，因為 IT-NOV-005 已經記錄咗呢筆支出');
  console.log('3. 1465A $3,505 + 00001465 $2,725 = $6,230: 移去12月');
})();
