const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

// Bank Statement - Current Account June 2025
const BANK = {
  opening: 3420.54,
  credit: 1840.00,   // Income
  debit: 73.50,      // Expense
  closing: 5187.04   // = 3420.54 + 1840 - 73.50
};

(async () => {
  console.log('='.repeat(70));
  console.log('June 2025 支票戶口 (Current Account) Analysis');
  console.log('='.repeat(70));
  
  console.log('\n📊 Bank Statement:');
  console.log('-'.repeat(50));
  console.log('Opening:  $' + BANK.opening.toFixed(2));
  console.log('Credit:   $' + BANK.credit.toFixed(2) + ' (Income)');
  console.log('Debit:    $' + BANK.debit.toFixed(2) + ' (Expense)');
  console.log('Closing:  $' + BANK.closing.toFixed(2));
  
  // Get all June 2025 transactions
  const { data: allTxns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('transaction_date');
  
  if (error) { console.error(error); return; }
  
  // Current filter (as per Intranet logic)
  const currentTxns = allTxns.filter(t => {
    if (t.payment_method === '支票' && t.expense_amount > 0) return true;
    if (t.income_category === '內部轉帳' && t.income_amount > 0) return true;
    return false;
  });
  
  console.log('\n📋 Intranet Current Account Transactions (current filter):');
  console.log('-'.repeat(70));
  let intranetIncome = 0, intranetExpense = 0;
  currentTxns.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.transaction_item?.substring(0,35)} | +$${t.income_amount || 0} -$${t.expense_amount || 0}`);
    intranetIncome += t.income_amount || 0;
    intranetExpense += t.expense_amount || 0;
  });
  console.log('-'.repeat(70));
  console.log('Intranet Income: $' + intranetIncome.toFixed(2));
  console.log('Intranet Expense: $' + intranetExpense.toFixed(2));
  
  // Check internal transfers (these should create income for Current)
  const internalOut = allTxns.filter(t => t.expense_category === '內部轉帳');
  const internalIn = allTxns.filter(t => t.income_category === '內部轉帳');
  
  console.log('\n📋 內部轉帳 Records:');
  console.log('-'.repeat(70));
  console.log('轉出 (from Savings, expense_category=內部轉帳):');
  internalOut.forEach(t => {
    console.log(`  ${t.journal_number} | ${t.transaction_date} | ${t.payment_method} | ${t.transaction_item?.substring(0,30)} | -$${t.expense_amount}`);
  });
  const totalOut = internalOut.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  console.log('  Total 轉出: $' + totalOut);
  
  console.log('\n轉入 (to Current, income_category=內部轉帳):');
  internalIn.forEach(t => {
    console.log(`  ${t.journal_number} | ${t.transaction_date} | ${t.payment_method} | ${t.transaction_item?.substring(0,30)} | +$${t.income_amount}`);
  });
  const totalIn = internalIn.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  console.log('  Total 轉入: $' + totalIn);
  
  console.log('\n' + '='.repeat(70));
  console.log('🔍 ANALYSIS:');
  console.log('='.repeat(70));
  
  console.log('\n問題 1: 支票 expense 唔等於銀行 debit');
  console.log('  Intranet 支票 expense: $' + intranetExpense.toFixed(2));
  console.log('  Bank debit:            $' + BANK.debit.toFixed(2));
  console.log('  差額:                  $' + (intranetExpense - BANK.debit).toFixed(2));
  console.log('  原因: 支票工資/商務餐等唔係從 Current Account 出，可能係從 Savings 出');
  
  console.log('\n問題 2: 冇內部轉帳收入');
  console.log('  Savings 轉出: $' + totalOut + ' (有記錄)');
  console.log('  Current 轉入: $' + totalIn + ' (冇記錄!)');
  console.log('  Bank credit:  $' + BANK.credit.toFixed(2));
  
  console.log('\n' + '='.repeat(70));
  console.log('🔧 WHAT\'S MISSING:');
  console.log('='.repeat(70));
  
  console.log('\n需要加入 Current Account 嘅記錄:');
  console.log('');
  console.log('1. 內部轉帳收入 (Credit $1,840.00):');
  console.log('   - payment_method: 支票');
  console.log('   - income_amount: 1840');
  console.log('   - income_category: 內部轉帳');
  console.log('   - transaction_item: 內部轉賬：支票戶口轉入自儲蓄戶口');
  console.log('');
  console.log('2. 支票簿費用 (Debit $73.50):');
  console.log('   - 已有 00000981 支票簿2本費用 $100');
  console.log('   - 但銀行只扣 $73.50');
  console.log('   - 需要確認：係咪 $100 包埋其他嘢？定係要改成 $73.50？');
  
  console.log('\n需要從 Current Account 移除嘅記錄:');
  console.log('');
  console.log('以下「支票」expense 唔係真正從 Current Account 出:');
  const chequeExpenses = currentTxns.filter(t => t.payment_method === '支票' && t.expense_amount > 0);
  chequeExpenses.forEach(t => {
    const isRealCurrentExpense = t.journal_number === '00000981'; // 支票簿費用
    console.log(`  ${isRealCurrentExpense ? '✅ KEEP' : '❌ REMOVE'} | ${t.journal_number} | ${t.transaction_item?.substring(0,35)} | -$${t.expense_amount}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 EXPECTED RESULT AFTER FIX:');
  console.log('='.repeat(70));
  console.log('Opening:  $' + BANK.opening.toFixed(2));
  console.log('+ Income: $' + BANK.credit.toFixed(2) + ' (內部轉帳)');
  console.log('- Expense: $' + BANK.debit.toFixed(2) + ' (支票簿費用)');
  console.log('= Closing: $' + BANK.closing.toFixed(2));
})();
