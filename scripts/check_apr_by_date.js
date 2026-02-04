const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 銀行結單存入 (全部)
const bankDeposits = [
  7500, 1040, 600, 1800, 3430, 1560, 50000, 1800, 300, 1800, 
  330, 300, 1200, 330, 300, 300, 250, 720, 300, 1040,
  1200, 300, 400, 600, 5525, 50, 900, 900, 1800, 9000,
  600, 300, 560, 330, 10000, 750, 50000, 1858, 5.61
];

// 銀行結單支出 (不含FPS $5手續費)
const bankWithdrawals = [
  1500, 14250, 1500, 300, 700, 6010, 1250, 1200, 1490, 5800,
  13470, 3430, 1650, 4200, 450, 7120, 4670, 2200,
  4000, 4160, 2800, 3000,
  19000, 75, 19000, 638.24, 11800
];

// FPS手續費 (20筆 x $5 = $100)
const bankFpsFees = 100;

async function main() {
  // 查詢 transaction_date 在 2025年4月 的銀行轉賬記錄
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  console.log('========================================');
  console.log('Database transaction_date 2025年4月 銀行轉賬');
  console.log('========================================\n');

  const incomes = data.filter(t => parseFloat(t.income_amount) > 0);
  const expenses = data.filter(t => parseFloat(t.expense_amount) > 0);

  console.log(`總筆數: ${data.length}`);
  console.log(`收入: ${incomes.length}筆`);
  console.log(`支出: ${expenses.length}筆`);

  // 收入明細
  console.log('\n【Database 收入】');
  incomes.forEach(t => {
    console.log(`  ${t.transaction_date} | $${parseFloat(t.income_amount).toFixed(2)} | ${t.item_name}`);
  });
  const dbIncomeAmts = incomes.map(t => parseFloat(t.income_amount));
  console.log(`  總計: $${dbIncomeAmts.reduce((s,a) => s+a, 0).toFixed(2)}`);

  // 支出明細
  console.log('\n【Database 支出】');
  expenses.forEach(t => {
    console.log(`  ${t.transaction_date} | $${parseFloat(t.expense_amount).toFixed(2)} | ${t.item_name}`);
  });
  const dbExpenseAmts = expenses.map(t => parseFloat(t.expense_amount));
  console.log(`  總計: $${dbExpenseAmts.reduce((s,a) => s+a, 0).toFixed(2)}`);

  // 對比
  console.log('\n\n========================================');
  console.log('金額對比');
  console.log('========================================');

  // 存入對比
  const unmatchedBankDep = [...bankDeposits];
  const unmatchedDbInc = [...dbIncomeAmts];

  for (let i = unmatchedDbInc.length - 1; i >= 0; i--) {
    const dbAmt = unmatchedDbInc[i];
    const bankIdx = unmatchedBankDep.findIndex(b => Math.abs(b - dbAmt) < 0.01);
    if (bankIdx !== -1) {
      unmatchedBankDep.splice(bankIdx, 1);
      unmatchedDbInc.splice(i, 1);
    }
  }

  console.log('\n【存入/收入】');
  console.log(`銀行: ${bankDeposits.length}筆 $${bankDeposits.reduce((s,a)=>s+a,0).toFixed(2)}`);
  console.log(`Database: ${incomes.length}筆 $${dbIncomeAmts.reduce((s,a)=>s+a,0).toFixed(2)}`);
  
  if (unmatchedBankDep.length > 0) {
    console.log(`\n❌ 銀行有但Database冇 (${unmatchedBankDep.length}筆):`);
    unmatchedBankDep.sort((a,b) => b-a).forEach(a => console.log(`   $${a.toFixed(2)}`));
    console.log(`   總計: $${unmatchedBankDep.reduce((s,a) => s+a, 0).toFixed(2)}`);
  } else {
    console.log('\n✅ 所有銀行存入都有對應Database記錄');
  }

  if (unmatchedDbInc.length > 0) {
    console.log(`\n⚠️ Database有但銀行結單冇 (${unmatchedDbInc.length}筆):`);
    unmatchedDbInc.sort((a,b) => b-a).forEach(a => console.log(`   $${a.toFixed(2)}`));
    console.log(`   總計: $${unmatchedDbInc.reduce((s,a) => s+a, 0).toFixed(2)}`);
  } else {
    console.log('\n✅ 所有Database收入都有對應銀行存入');
  }

  // 支出對比
  const unmatchedBankWith = [...bankWithdrawals];
  const unmatchedDbExp = [...dbExpenseAmts];

  // 檢查 FPS 手續費 lump sum
  const feeIdx = unmatchedDbExp.findIndex(a => Math.abs(a - 110) < 0.01 || Math.abs(a - 100) < 0.01);
  if (feeIdx !== -1) {
    const dbFee = unmatchedDbExp[feeIdx];
    console.log(`\n📝 FPS手續費: Database $${dbFee} vs 銀行 $${bankFpsFees}`);
    unmatchedDbExp.splice(feeIdx, 1);
  }

  for (let i = unmatchedDbExp.length - 1; i >= 0; i--) {
    const dbAmt = unmatchedDbExp[i];
    const bankIdx = unmatchedBankWith.findIndex(b => Math.abs(b - dbAmt) < 0.01);
    if (bankIdx !== -1) {
      unmatchedBankWith.splice(bankIdx, 1);
      unmatchedDbExp.splice(i, 1);
    }
  }

  console.log('\n【支出】');
  console.log(`銀行: ${bankWithdrawals.length}筆 $${bankWithdrawals.reduce((s,a)=>s+a,0).toFixed(2)} + FPS手續費 $${bankFpsFees}`);
  console.log(`Database: ${expenses.length}筆 $${dbExpenseAmts.reduce((s,a)=>s+a,0).toFixed(2)}`);
  
  if (unmatchedBankWith.length > 0) {
    console.log(`\n❌ 銀行有但Database冇 (${unmatchedBankWith.length}筆):`);
    unmatchedBankWith.sort((a,b) => b-a).forEach(a => console.log(`   $${a.toFixed(2)}`));
    console.log(`   總計: $${unmatchedBankWith.reduce((s,a) => s+a, 0).toFixed(2)}`);
  } else {
    console.log('\n✅ 所有銀行支出都有對應Database記錄');
  }

  if (unmatchedDbExp.length > 0) {
    console.log(`\n⚠️ Database有但銀行結單冇 (${unmatchedDbExp.length}筆):`);
    unmatchedDbExp.sort((a,b) => b-a).forEach(a => console.log(`   $${a.toFixed(2)}`));
    console.log(`   總計: $${unmatchedDbExp.reduce((s,a) => s+a, 0).toFixed(2)}`);
  } else {
    console.log('\n✅ 所有Database支出都有對應銀行支出');
  }
}

main().catch(console.error);
