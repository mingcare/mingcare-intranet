const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 模擬 getLedgerOpeningBalance 的邏輯
  const selectedMonth = '2025-05';
  const DISPLAY_START_MONTH = '2025-04';
  const accountType = 'current';
  const CHEQUE_ACCOUNT_OPENING_BALANCE = 1086.54;
  
  // 取得所有未刪除交易
  const { data: transactions } = await supabase.from('financial_transactions')
    .select('*')
    .eq('is_deleted', false);
  
  const getMonthFromDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // 計算所選月份之前所有交易的淨值
  const priorTransactions = transactions.filter(t => {
    const txnMonth = getMonthFromDate(t.transaction_date);
    if (txnMonth >= selectedMonth || txnMonth < DISPLAY_START_MONTH) return false;
    
    const paymentMethod = (t.payment_method || '').trim();
    
    // 支票戶口邏輯
    if (paymentMethod === '支票') {
      return (t.expense_amount || 0) > 0 || (t.income_amount > 0 && t.income_category === '內部轉帳');
    }
    return false;
  });
  
  console.log('=== 模擬 getLedgerOpeningBalance (支票戶口, 5月) ===\n');
  console.log('篩選條件: 4月份支票戶口交易 (支票支出 + 內部轉帳收入)');
  console.log(`找到 ${priorTransactions.length} 筆交易:\n`);
  
  let netChange = 0;
  priorTransactions.forEach(t => {
    const change = (t.income_amount || 0) - (t.expense_amount || 0);
    netChange += change;
    console.log(`${t.journal_number} | ${t.transaction_date} | Inc:$${t.income_amount || 0} | Exp:$${t.expense_amount || 0} | Net:$${change}`);
    console.log(`  ${t.transaction_item}`);
  });
  
  console.log(`\n淨變動總計: $${netChange}`);
  console.log(`期初餘額: $${CHEQUE_ACCOUNT_OPENING_BALANCE}`);
  console.log(`計算5月期初: $${(CHEQUE_ACCOUNT_OPENING_BALANCE + netChange).toFixed(2)}`);
  console.log(`應該係: $3,040.54`);
})();
