const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function analyze() {
  // 銀行結單數據 (May 2025)
  const bankData = {
    openingBalance: 103530.96,
    totalWithdrawals: 268524.00,
    totalDeposits: 206071.57,
    closingBalance: 41078.53
  };

  console.log('=== 銀行結單 May 2025 ===');
  console.log('Opening Balance:', bankData.openingBalance);
  console.log('Total Deposits:', bankData.totalDeposits);
  console.log('Total Withdrawals:', bankData.totalWithdrawals);
  console.log('Closing Balance:', bankData.closingBalance);
  console.log('Calculated:', (bankData.openingBalance + bankData.totalDeposits - bankData.totalWithdrawals).toFixed(2));

  // 獲取數據庫記錄
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '銀行轉賬')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  let dbIncome = 0;
  let dbExpense = 0;
  data.forEach(t => {
    dbIncome += parseFloat(t.income_amount) || 0;
    dbExpense += parseFloat(t.expense_amount) || 0;
  });

  console.log('\n=== 數據庫 May 2025 (銀行轉賬) ===');
  console.log('Records:', data.length);
  console.log('Total Income:', dbIncome.toFixed(2));
  console.log('Total Expense:', dbExpense.toFixed(2));
  console.log('Net Change:', (dbIncome - dbExpense).toFixed(2));

  console.log('\n=== 差異分析 ===');
  console.log('銀行 Deposits:', bankData.totalDeposits);
  console.log('數據庫 Income:', dbIncome.toFixed(2));
  console.log('Income 差異:', (bankData.totalDeposits - dbIncome).toFixed(2));
  
  console.log('\n銀行 Withdrawals:', bankData.totalWithdrawals);
  console.log('數據庫 Expense:', dbExpense.toFixed(2));
  console.log('Expense 差異:', (bankData.totalWithdrawals - dbExpense).toFixed(2));

  // 檢查可能的問題
  console.log('\n=== 需要檢查的交易 ===');
  
  // 內部轉賬
  const internalTransfers = data.filter(t => 
    t.income_category === '內部轉帳' || t.expense_category === '內部轉帳'
  );
  console.log('\n內部轉賬交易:', internalTransfers.length);
  internalTransfers.forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item}`);
  });

  // 檢查重複的銀行利息/手續費
  const bankFees = data.filter(t => 
    t.expense_category === '銀行手續費' || t.income_category === '銀行利息'
  );
  console.log('\n銀行利息/手續費:', bankFees.length);
  bankFees.forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0}`);
  });

  // 大額交易 (>$10000)
  const largeTransactions = data.filter(t => 
    (parseFloat(t.income_amount) || 0) >= 10000 || (parseFloat(t.expense_amount) || 0) >= 10000
  );
  console.log('\n大額交易 (>=$10,000):');
  largeTransactions.forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item}`);
  });
}

analyze();
