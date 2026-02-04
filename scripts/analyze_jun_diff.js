const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

// June 2025 Bank Statement - Savings Account 002113176
// From earlier extraction
const BANK_TRANSACTIONS = [
  // Credits (Income)
  { date: '2025-06-02', type: 'CR', amount: 300, desc: 'FPS' },
  { date: '2025-06-02', type: 'CR', amount: 300, desc: 'FPS' },
  { date: '2025-06-04', type: 'CR', amount: 330, desc: 'FPS' },
  { date: '2025-06-04', type: 'CR', amount: 50000, desc: 'FPS' },
  { date: '2025-06-05', type: 'CR', amount: 50000, desc: 'FPS' },
  { date: '2025-06-09', type: 'CR', amount: 3900, desc: 'FPS' },
  { date: '2025-06-11', type: 'CR', amount: 390, desc: 'FPS' },
  { date: '2025-06-12', type: 'CR', amount: 780, desc: 'FPS' },
  { date: '2025-06-14', type: 'CR', amount: 1400, desc: 'FPS' },
  { date: '2025-06-16', type: 'CR', amount: 1900, desc: 'FPS' },
  { date: '2025-06-17', type: 'CR', amount: 1320, desc: 'FPS' },
  { date: '2025-06-18', type: 'CR', amount: 3510, desc: 'FPS' },
  { date: '2025-06-18', type: 'CR', amount: 1890, desc: 'FPS/醫點' },
  { date: '2025-06-20', type: 'CR', amount: 2250, desc: 'FPS' },
  { date: '2025-06-20', type: 'CR', amount: 3450, desc: 'FPS' },
  { date: '2025-06-23', type: 'CR', amount: 50000, desc: 'FPS' },
  { date: '2025-06-24', type: 'CR', amount: 300, desc: 'FPS' },
  { date: '2025-06-25', type: 'CR', amount: 1170, desc: 'FPS' },
  { date: '2025-06-25', type: 'CR', amount: 2250, desc: 'FPS' },
  { date: '2025-06-25', type: 'CR', amount: 3150, desc: 'FPS' },
  { date: '2025-06-26', type: 'CR', amount: 50000, desc: 'FPS' },
  { date: '2025-06-26', type: 'CR', amount: 450, desc: 'FPS' },
  { date: '2025-06-27', type: 'CR', amount: 325, desc: 'FPS' },
  { date: '2025-06-28', type: 'CR', amount: 50000, desc: 'FPS' },
  { date: '2025-06-30', type: 'CR', amount: 5070, desc: 'FPS' },
  { date: '2025-06-30', type: 'CR', amount: 5000, desc: 'FPS/Kanas' },
  { date: '2025-06-30', type: 'CR', amount: 3450, desc: 'FPS' },
  { date: '2025-06-30', type: 'CR', amount: 390, desc: 'FPS' },
  { date: '2025-06-30', type: 'CR', amount: 5.24, desc: '利息' },
  // Total Credit should be $85,056.68 based on bank statement
];

(async () => {
  console.log('='.repeat(80));
  console.log('June 2025 Savings Account - Detailed Discrepancy Analysis');
  console.log('='.repeat(80));
  
  // Get all June 2025 銀行轉賬 transactions
  const { data: intranetTxns, error } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('payment_method', '銀行轉賬')
    .order('transaction_date');
  
  if (error) { console.error(error); return; }
  
  // Group by category
  const incomeByCategory = {};
  const expenseByCategory = {};
  
  intranetTxns.forEach(t => {
    if (t.income_amount > 0) {
      const cat = t.income_category || '未分類';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.income_amount;
    }
    if (t.expense_amount > 0) {
      const cat = t.expense_category || '未分類';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.expense_amount;
    }
  });
  
  console.log('\n📊 Income by Category:');
  console.log('-'.repeat(50));
  let totalIncome = 0;
  Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
    console.log(`${cat.padEnd(30)} $${amt.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
    totalIncome += amt;
  });
  console.log('-'.repeat(50));
  console.log(`Total Income: $${totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Bank Credit:  $85,056.68`);
  console.log(`Diff:         $${(totalIncome - 85056.68).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  
  console.log('\n📊 Expense by Category:');
  console.log('-'.repeat(50));
  let totalExpense = 0;
  Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
    console.log(`${cat.padEnd(30)} $${amt.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
    totalExpense += amt;
  });
  console.log('-'.repeat(50));
  console.log(`Total Expense: $${totalExpense.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Bank Debit:    $55,320.00`);
  console.log(`Diff:          $${(totalExpense - 55320).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  
  // Check for duplicates
  console.log('\n🔍 Checking for potential duplicates...');
  console.log('-'.repeat(50));
  
  const seen = {};
  intranetTxns.forEach(t => {
    const key = `${t.transaction_date}_${t.income_amount}_${t.expense_amount}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(t);
  });
  
  Object.entries(seen).filter(([k, v]) => v.length > 1).forEach(([k, txns]) => {
    console.log(`\n⚠️  Potential duplicate (${txns.length} records):`);
    txns.forEach(t => {
      console.log(`   ${t.journal_number} | ${t.transaction_item?.substring(0, 40)} | +$${t.income_amount || 0} -$${t.expense_amount || 0}`);
    });
  });
  
  // Look for 利息 transactions specifically
  console.log('\n🔍 利息 (Interest) transactions:');
  console.log('-'.repeat(50));
  intranetTxns.filter(t => 
    t.transaction_item?.includes('利息') || 
    t.income_category === '銀行利息'
  ).forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item} | +$${t.income_amount || 0}`);
  });
  
  // Look for 手續費 transactions
  console.log('\n🔍 手續費 (Bank fees) transactions:');
  console.log('-'.repeat(50));
  intranetTxns.filter(t => 
    t.transaction_item?.includes('手續費') || 
    t.expense_category === '銀行手續費'
  ).forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item?.substring(0, 50)} | -$${t.expense_amount || 0}`);
  });
  
  // Calculate what the closing should be
  console.log('\n📈 Closing Balance Calculation:');
  console.log('-'.repeat(50));
  const opening = 41078.53;
  const intranetClosing = opening + totalIncome - totalExpense;
  const bankClosing = 70815.21;
  
  console.log(`Opening:          $${opening.toFixed(2)}`);
  console.log(`+ Income:         $${totalIncome.toFixed(2)}`);
  console.log(`- Expense:        $${totalExpense.toFixed(2)}`);
  console.log(`= Intranet Close: $${intranetClosing.toFixed(2)}`);
  console.log(`  Bank Closing:   $${bankClosing.toFixed(2)}`);
  console.log(`  Difference:     $${(bankClosing - intranetClosing).toFixed(2)}`);
  
  console.log('\n💡 Analysis:');
  console.log('-'.repeat(50));
  console.log('Intranet is $149.76 LOWER than bank.');
  console.log('This means either:');
  console.log('  1. Intranet has EXTRA expense of $149.76, OR');
  console.log('  2. Intranet is MISSING income of $149.76');
  
  // Check Mr Yau deposits
  console.log('\n🔍 Mr Yau deposits (股東資本):');
  console.log('-'.repeat(50));
  const yauTxns = intranetTxns.filter(t => t.transaction_item?.includes('Mr Yau') || t.transaction_item?.includes('Yau'));
  let yauTotal = 0;
  yauTxns.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item} | +$${t.income_amount || 0}`);
    yauTotal += t.income_amount || 0;
  });
  console.log(`Total Mr Yau: $${yauTotal}`);
  console.log('Bank likely shows 5 x $50,000 = $250,000');
  
  // Check 內部轉帳
  console.log('\n🔍 內部轉帳 transactions:');
  console.log('-'.repeat(50));
  const internalTxns = intranetTxns.filter(t => 
    t.expense_category === '內部轉帳' || 
    t.income_category === '內部轉帳' ||
    t.transaction_item?.includes('內部轉帳')
  );
  let internalTotal = 0;
  internalTxns.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item?.substring(0, 40)} | -$${t.expense_amount || 0}`);
    internalTotal += t.expense_amount || 0;
  });
  console.log(`Total 內部轉帳: $${internalTotal}`);
  
})();
