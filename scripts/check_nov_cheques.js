const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== November 2025 Cheque Analysis ===\n');
  
  const { data: cheques } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '支票')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30')
    .gt('expense_amount', 0)
    .order('expense_amount', { ascending: false });
  
  console.log('支票戶口支出 (Nov):');
  let total = 0;
  cheques.forEach(c => {
    total += c.expense_amount;
    console.log(`  ${c.transaction_date} | ${c.journal_number} | $${c.expense_amount} | ${c.transaction_item?.substring(0,25)}`);
  });
  console.log('\n  Total:', total);
  console.log('  Bank Expense: 60,613');
  console.log('  Diff:', 60613 - total);
  
  // Bank cheque list from statement
  console.log('\n\n銀行月結單支出項目 (Nov):');
  console.log('  06-Nov: $12,684 CASH');
  console.log('  10-Nov: $7,400 CASH');
  console.log('  11-Nov: $11,006 INWARD');
  console.log('  13-Nov: $1,633 INWARD');
  console.log('  18-Nov: $1,840 CASH');
  console.log('  18-Nov: $3,475 CASH');
  console.log('  20-Nov: $13,270 FPS (IT)');
  console.log('  20-Nov: $5 FEE');
  console.log('  21-Nov: $1,380 CASH');
  console.log('  24-Nov: $7,920 (IT)');
  const bankTotal = 12684 + 7400 + 11006 + 1633 + 1840 + 3475 + 13270 + 5 + 1380 + 7920;
  console.log('  Bank Total:', bankTotal);
})();
