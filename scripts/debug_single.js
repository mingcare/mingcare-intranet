const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 直接檢查 00000685
  const { data } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', '00000685')
    .single();
  
  console.log('=== 00000685 完整資料 ===\n');
  console.log('transaction_date:', data.transaction_date);
  console.log('payment_method:', `"${data.payment_method}"`);
  console.log('payment_method length:', data.payment_method?.length);
  console.log('expense_amount:', data.expense_amount);
  console.log('is_deleted:', data.is_deleted);
  
  // 檢查月份計算
  const getMonthFromDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const txnMonth = getMonthFromDate(data.transaction_date);
  console.log('\ntxnMonth:', txnMonth);
  console.log('selectedMonth:', '2025-05');
  console.log('DISPLAY_START_MONTH:', '2025-04');
  console.log('txnMonth >= selectedMonth?', txnMonth >= '2025-05');
  console.log('txnMonth < DISPLAY_START_MONTH?', txnMonth < '2025-04');
  
  // 問題可能係 getMonthFromDate
  console.log('\n=== 測試 getMonthFromDate ===');
  console.log('Input:', data.transaction_date);
  console.log('new Date():', new Date(data.transaction_date));
  console.log('getMonth():', new Date(data.transaction_date).getMonth());
  console.log('Result:', getMonthFromDate(data.transaction_date));
})();
