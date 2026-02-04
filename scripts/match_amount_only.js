const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 銀行結單 - 所有存入金額 (deposits)
const bankDeposits = [
  7500, 1040, 600, 1800, 3430, 1560, 50000, 1800, 300, 1800, 
  330, 300, 1200, 330, 300, 300, 250, 720, 300, 1040,
  1200, 300, 400, 600, 5525, 50, 900, 900, 1800, 9000,
  600, 300, 560, 330, 10000, 750, 50000, 1858, 5.61
];

// 銀行結單 - 所有支出金額 (withdrawals) - 不含FPS手續費
const bankWithdrawals = [
  1500, 14250, 1500, 300, 700, 6010, 1250, 1200, 1490, 5800,
  13470, 3430, 1650, 4200, 450, 7120, 4670, 2200,
  4000, 4160, 2800, 3000,
  19000, 75, 19000, 638.24, 11800
];

async function main() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('income_amount, expense_amount, transaction_item, transaction_date')
    .eq('billing_month', '2025年4月')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false);

  if (error) { console.error(error); return; }

  // 系統收入金額
  const sysIncomeAmounts = data
    .filter(t => parseFloat(t.income_amount) > 0)
    .map(t => ({ amount: parseFloat(t.income_amount), item: t.transaction_item, date: t.transaction_date }));

  // 系統支出金額
  const sysExpenseAmounts = data
    .filter(t => parseFloat(t.expense_amount) > 0)
    .map(t => ({ amount: parseFloat(t.expense_amount), item: t.transaction_item, date: t.transaction_date }));

  console.log('========================================');
  console.log('2025年4月 儲蓄戶口 - 純金額對比');
  console.log('========================================\n');

  // === 存入/收入對比 ===
  console.log('【存入/收入】\n');
  
  const unmatchedBankDep = [...bankDeposits];
  const unmatchedSysInc = [...sysIncomeAmounts];

  // Match by amount
  for (let i = unmatchedSysInc.length - 1; i >= 0; i--) {
    const sysAmt = unmatchedSysInc[i].amount;
    const bankIdx = unmatchedBankDep.findIndex(b => Math.abs(b - sysAmt) < 0.01);
    if (bankIdx !== -1) {
      unmatchedBankDep.splice(bankIdx, 1);
      unmatchedSysInc.splice(i, 1);
    }
  }

  console.log('❌ 銀行有但Database冇:');
  if (unmatchedBankDep.length === 0) {
    console.log('   (無)');
  } else {
    unmatchedBankDep.sort((a,b) => b - a).forEach(amt => {
      console.log(`   $${amt.toFixed(2)}`);
    });
    console.log(`   總計: $${unmatchedBankDep.reduce((s,a) => s+a, 0).toFixed(2)}`);
  }

  console.log('\n⚠️ Database有但銀行結單冇:');
  if (unmatchedSysInc.length === 0) {
    console.log('   (無)');
  } else {
    unmatchedSysInc.sort((a,b) => b.amount - a.amount).forEach(s => {
      console.log(`   $${s.amount.toFixed(2)} - ${s.date} ${s.item?.substring(0,30)}`);
    });
    console.log(`   總計: $${unmatchedSysInc.reduce((s,a) => s+a.amount, 0).toFixed(2)}`);
  }

  // === 支出對比 ===
  console.log('\n\n【支出】\n');
  
  const unmatchedBankWith = [...bankWithdrawals];
  const unmatchedSysExp = [...sysExpenseAmounts];

  // Match by amount
  for (let i = unmatchedSysExp.length - 1; i >= 0; i--) {
    const sysAmt = unmatchedSysExp[i].amount;
    const bankIdx = unmatchedBankWith.findIndex(b => Math.abs(b - sysAmt) < 0.01);
    if (bankIdx !== -1) {
      unmatchedBankWith.splice(bankIdx, 1);
      unmatchedSysExp.splice(i, 1);
    }
  }

  console.log('❌ 銀行有但Database冇:');
  if (unmatchedBankWith.length === 0) {
    console.log('   (無)');
  } else {
    unmatchedBankWith.sort((a,b) => b - a).forEach(amt => {
      console.log(`   $${amt.toFixed(2)}`);
    });
    console.log(`   總計: $${unmatchedBankWith.reduce((s,a) => s+a, 0).toFixed(2)}`);
  }

  console.log('\n⚠️ Database有但銀行結單冇:');
  if (unmatchedSysExp.length === 0) {
    console.log('   (無)');
  } else {
    unmatchedSysExp.sort((a,b) => b.amount - a.amount).forEach(s => {
      console.log(`   $${s.amount.toFixed(2)} - ${s.date} ${s.item?.substring(0,30)}`);
    });
    console.log(`   總計: $${unmatchedSysExp.reduce((s,a) => s+a.amount, 0).toFixed(2)}`);
  }

  // Summary
  console.log('\n\n========================================');
  console.log('總結');
  console.log('========================================');
  console.log(`\n銀行存入: ${bankDeposits.length}筆, $${bankDeposits.reduce((s,a)=>s+a,0).toFixed(2)}`);
  console.log(`系統收入: ${sysIncomeAmounts.length}筆, $${sysIncomeAmounts.reduce((s,a)=>s+a.amount,0).toFixed(2)}`);
  console.log(`\n銀行支出: ${bankWithdrawals.length}筆, $${bankWithdrawals.reduce((s,a)=>s+a,0).toFixed(2)}`);
  console.log(`系統支出: ${sysExpenseAmounts.length}筆, $${sysExpenseAmounts.reduce((s,a)=>s+a.amount,0).toFixed(2)}`);
}

main().catch(console.error);
