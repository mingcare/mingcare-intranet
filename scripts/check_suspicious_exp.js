const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Intranet 12月 Expense 有但 Bank 冇嘅工資
const suspiciousRecords = [
  '00001624', // 戴汶慧 $1,920
  '00001625', // 譚文慧 $7,920
  '00001626', // 譚容容 $3,300
  '00001627', // 賴佩玲 $7,480
  '00001628', // 夏洪桃 $16,200
  '00001629', // 呂宛芸 $6,270
  '00001630', // 龍鳳琼 $9,574
  '00001631', // 劉建群 $3,380
  '00001632', // 許秀容 $1,830
  '1563A',    // Petty Cash $5,000
  '00001646', // Petty Cash $5,000
  '00001665', // Petty Cash $5,000
];

(async () => {
  console.log('=== 可疑記錄詳情 ===\n');
  let suspiciousTotal = 0;
  
  for (const jn of suspiciousRecords) {
    const { data } = await supabase.from('financial_transactions')
      .select('*')
      .eq('journal_number', jn);
    
    if (data && data[0]) {
      const r = data[0];
      const amt = parseFloat(r.expense_amount);
      suspiciousTotal += amt;
      console.log('Journal:', jn);
      console.log('  Date:', r.transaction_date);
      console.log('  Billing Month:', r.billing_month);
      console.log('  Amount: $' + amt);
      console.log('  Item:', r.transaction_item);
      console.log('  Payment:', r.payment_method);
      console.log('  Notes:', r.notes || '(none)');
      console.log('');
    }
  }
  
  console.log('=== Total Suspicious: $' + suspiciousTotal + ' ===');
  console.log('Expense Diff was: $47,654');
  console.log('If we exclude these, diff would be: $' + (47654 - suspiciousTotal));
})();
