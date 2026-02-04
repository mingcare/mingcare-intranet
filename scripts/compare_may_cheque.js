const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== 5月份支票戶口對帳 ===\n');
  
  // 銀行結單數據
  const bankStatement = {
    opening: 3040.54,
    closing: 3420.54,
    deposits: [
      { date: '02-May', amount: 18165, desc: 'EBICT50502044192 內部轉帳' },
      { date: '02-May', amount: 3000, desc: 'EBICT50502044197 內部轉帳' },
    ],
    withdrawals: [
      { date: '08-May', chequeNo: '69', amount: 3950 },
      { date: '08-May', chequeNo: '70', amount: 100 },
      { date: '08-May', chequeNo: '71', amount: 2570 },
      { date: '09-May', chequeNo: '64', amount: 5700 },
      { date: '10-May', chequeNo: '65', amount: 7665 },
      { date: '19-May', chequeNo: '66', amount: 600 },
      { date: '23-May', chequeNo: '67', amount: 200 },
    ]
  };
  
  const bankTotalDeposit = bankStatement.deposits.reduce((s, d) => s + d.amount, 0);
  const bankTotalWithdraw = bankStatement.withdrawals.reduce((s, d) => s + d.amount, 0);
  
  console.log('銀行結單:');
  console.log(`  期初: $${bankStatement.opening}`);
  console.log(`  存入: $${bankTotalDeposit}`);
  console.log(`  支出: $${bankTotalWithdraw}`);
  console.log(`  期末: $${bankStatement.closing}`);
  console.log(`  驗算: ${bankStatement.opening} + ${bankTotalDeposit} - ${bankTotalWithdraw} = $${bankStatement.opening + bankTotalDeposit - bankTotalWithdraw}`);
  
  // 數據庫記錄 (支票戶口 = payment_method 支票)
  const { data: records } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, payment_method, income_category, expense_category')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '支票')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');
  
  console.log('\n=== 數據庫支票記錄 (5月份) ===');
  
  let dbIncome = 0;
  let dbExpense = 0;
  
  records.forEach(r => {
    const inc = Number(r.income_amount) || 0;
    const exp = Number(r.expense_amount) || 0;
    dbIncome += inc;
    dbExpense += exp;
    
    // 嘗試提取支票號碼
    const chequeMatch = r.transaction_item.match(/支票[Nn]o\.?(\d+)/i) || r.transaction_item.match(/No\.?(\d+)/i);
    const chequeNo = chequeMatch ? chequeMatch[1] : '?';
    
    console.log(`${r.journal_number} | ${r.transaction_date} | 支票#${chequeNo} | Inc:$${inc} | Exp:$${exp}`);
    console.log(`  ${r.transaction_item}`);
  });
  
  console.log('\n--- 數據庫總計 ---');
  console.log(`  總收入: $${dbIncome}`);
  console.log(`  總支出: $${dbExpense}`);
  
  const diff = dbExpense - bankTotalWithdraw;
  console.log(`\n支出差異: $${diff} (DB多咗)`);
  
  if (diff !== 0) {
    console.log('\n=== 搵差異記錄 ===');
    
    // 列出銀行結單嘅支票號碼
    const bankCheques = new Set(bankStatement.withdrawals.map(w => w.chequeNo));
    console.log('銀行結單支票: ' + Array.from(bankCheques).join(', '));
    
    // 檢查數據庫有冇唔喺銀行結單嘅支票
    records.forEach(r => {
      if (r.expense_amount > 0) {
        const chequeMatch = r.transaction_item.match(/支票[Nn]o\.?(\d+)/i) || r.transaction_item.match(/No\.?(\d+)/i);
        const chequeNo = chequeMatch ? chequeMatch[1] : null;
        
        if (chequeNo && !bankCheques.has(chequeNo)) {
          console.log(`\n⚠️ 支票#${chequeNo} 唔喺5月銀行結單!`);
          console.log(`   ${r.journal_number} | ${r.transaction_date} | $${r.expense_amount}`);
          console.log(`   ${r.transaction_item}`);
          console.log('   → 可能係6月先兌現，需要改 transaction_date');
        }
      }
    });
  }
})();
