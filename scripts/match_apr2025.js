const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// Bank statement - all HKD transactions from 01-Apr to 30-Apr-2025
const bankDeposits = [
  { date: '02-Apr', amount: 7500, desc: 'LAM SIU FONG' },
  { date: '03-Apr', amount: 1040, desc: 'CHEQUE DEPOSIT 701210' },
  { date: '05-Apr', amount: 600, desc: 'YIP CHU LEUNG' },
  { date: '06-Apr', amount: 1800, desc: 'HO TAK CHUI' },
  { date: '07-Apr', amount: 3430, desc: 'CR Refund' },
  { date: '07-Apr', amount: 1560, desc: 'YAU YUET WA ANRIQUE' },
  { date: '08-Apr', amount: 50000, desc: 'YAU KIN NAM' },
  { date: '12-Apr', amount: 1800, desc: 'HO TAK CHUI' },
  { date: '13-Apr', amount: 300, desc: 'WONG HAU YEE' },
  { date: '13-Apr', amount: 1800, desc: 'CHAN MEI WING' },
  { date: '13-Apr', amount: 330, desc: 'YIP CHU LEUNG' },
  { date: '13-Apr', amount: 300, desc: 'WONG HAU YEE' },
  { date: '13-Apr', amount: 1200, desc: 'YIP CHU LEUNG' },
  { date: '14-Apr', amount: 330, desc: 'YIP CHU LEUNG' },
  { date: '14-Apr', amount: 300, desc: 'CHAN YIU MAN' },
  { date: '14-Apr', amount: 300, desc: 'CHAN KA YAN' },
  { date: '15-Apr', amount: 250, desc: 'KWAN MAN KEE' },
  { date: '16-Apr', amount: 720, desc: 'CHAN WING YAN' },
  { date: '16-Apr', amount: 300, desc: 'NG PUI LIN' },
  { date: '17-Apr', amount: 1040, desc: 'YAU YUET WA ANRIQUE' },
  { date: '18-Apr', amount: 1200, desc: 'HO TAK CHUI' },
  { date: '19-Apr', amount: 300, desc: 'WONG MAN YEE' },
  { date: '19-Apr', amount: 400, desc: 'CHAN MEI WING' },
  { date: '19-Apr', amount: 600, desc: 'YIP CHU LEUNG' },
  { date: '20-Apr', amount: 5525, desc: 'KWOK KAM TIM' },
  { date: '22-Apr', amount: 50, desc: 'WONG MAN YEE' },
  { date: '23-Apr', amount: 900, desc: 'LEUNG PUI MAN KANAS' },
  { date: '24-Apr', amount: 900, desc: 'LUI YUEN WAN VIVIAN' },
  { date: '25-Apr', amount: 1800, desc: 'HO TAK CHUI' },
  { date: '26-Apr', amount: 9000, desc: 'LAM SIU FONG' },
  { date: '27-Apr', amount: 600, desc: 'LEE YUK CHUN' },
  { date: '28-Apr', amount: 300, desc: 'YAN KA WING' },
  { date: '28-Apr', amount: 560, desc: 'YIP CHU LEUNG' },
  { date: '28-Apr', amount: 330, desc: 'YIP CHU LEUNG' },
  { date: '28-Apr', amount: 10000, desc: 'SLASHER BUILDER LIMITED' },
  { date: '29-Apr', amount: 750, desc: 'LEUNG PUI MAN KANAS' },
  { date: '30-Apr', amount: 50000, desc: 'YAU KIN NAM' },
  { date: '30-Apr', amount: 1858, desc: 'SLASHER BUILDER LIMITED' },
  { date: '30-Apr', amount: 5.61, desc: 'INTEREST' },
];

const bankWithdrawals = [
  { date: '02-Apr', amount: 1500, desc: 'AIA CO (T) LTD' },
  { date: '03-Apr', amount: 14250, desc: 'Ho Ka Fung Candy' },
  { date: '03-Apr', amount: 1500, desc: 'Leung Hui Fung' },
  { date: '03-Apr', amount: 300, desc: 'Tang Kwok Hung' },
  { date: '03-Apr', amount: 700, desc: 'Chick Ka Wai' },
  { date: '03-Apr', amount: 6010, desc: 'Suen Ming Kuen' },
  { date: '03-Apr', amount: 1250, desc: 'Kuang Qian Wen' },
  { date: '03-Apr', amount: 1200, desc: 'Cheng Sau Chun' },
  { date: '03-Apr', amount: 1490, desc: 'Wang Li Hong' },
  { date: '03-Apr', amount: 5800, desc: 'Yu Chui Ying Ken' },
  { date: '03-Apr', amount: 13470, desc: 'MINGCARE HOME Internal Transfer' },
  { date: '03-Apr', amount: 3430, desc: 'Lau Suet Nagi' },
  { date: '03-Apr', amount: 1650, desc: 'Yu Yung Hsu' },
  { date: '03-Apr', amount: 4200, desc: 'Yu Tsui King' },
  { date: '03-Apr', amount: 450, desc: 'Wang Dong Ming' },
  { date: '03-Apr', amount: 7120, desc: 'Pu Chunrong' },
  { date: '03-Apr', amount: 4670, desc: 'Chu Tung Ping' },
  { date: '03-Apr', amount: 2200, desc: 'Chuk Fung Sin' },
  { date: '08-Apr', amount: 4000, desc: 'AIA CO (T) LTD' },
  { date: '08-Apr', amount: 4160, desc: 'Yeung Yee On' },
  { date: '08-Apr', amount: 2800, desc: 'Ho Ka Fung Candy' },
  { date: '08-Apr', amount: 3000, desc: 'Ho Ka Fung Candy' },
  { date: '15-Apr', amount: 19000, desc: 'Leung Pui Man Kanas' },
  { date: '24-Apr', amount: 75, desc: 'AIA CO (T) LTD' },
  { date: '26-Apr', amount: 19000, desc: 'Cheung Kwun Ho Joe' },
  { date: '30-Apr', amount: 638.24, desc: 'Kyocera Document Solutions' },
  { date: '30-Apr', amount: 11800, desc: 'Ruby Investment Ltd Rent' },
];

// FPS fees from bank statement (counting from statement)
const fpsFees = [
  { date: '03-Apr', amount: 5, count: 13 }, // 65
  { date: '08-Apr', amount: 5, count: 3 },  // 15
  { date: '15-Apr', amount: 5, count: 1 },  // 5
  { date: '26-Apr', amount: 5, count: 1 },  // 5
  { date: '30-Apr', amount: 5, count: 2 },  // 10
];
const totalFpsFees = fpsFees.reduce((s, f) => s + f.amount * f.count, 0);

async function main() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('billing_month', '2025年4月')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  // Separate income and expense
  const sysIncome = data.filter(t => parseFloat(t.income_amount) > 0);
  const sysExpense = data.filter(t => parseFloat(t.expense_amount) > 0);

  console.log('========================================');
  console.log('2025年4月 儲蓄戶口 金額對賬');
  console.log('========================================\n');

  // Match deposits by amount
  console.log('【存入/收入對比】\n');
  
  const unmatchedBankDeposits = [...bankDeposits];
  const unmatchedSysIncome = [...sysIncome];
  const matchedDeposits = [];

  for (let i = unmatchedSysIncome.length - 1; i >= 0; i--) {
    const sys = unmatchedSysIncome[i];
    const sysAmt = parseFloat(sys.income_amount);
    
    const bankIdx = unmatchedBankDeposits.findIndex(b => Math.abs(b.amount - sysAmt) < 0.01);
    if (bankIdx !== -1) {
      const bank = unmatchedBankDeposits[bankIdx];
      matchedDeposits.push({ sys, bank, amount: sysAmt });
      unmatchedBankDeposits.splice(bankIdx, 1);
      unmatchedSysIncome.splice(i, 1);
    }
  }

  console.log(`✅ 金額相符的存入: ${matchedDeposits.length} 筆`);
  matchedDeposits.forEach(m => {
    console.log(`   $${m.amount.toFixed(2)} - 系統: ${m.sys.transaction_item?.substring(0,25)} | 銀行: ${m.bank.desc}`);
  });

  console.log(`\n❌ 銀行有但系統沒有的存入: ${unmatchedBankDeposits.length} 筆`);
  let missingDepositTotal = 0;
  unmatchedBankDeposits.forEach(b => {
    console.log(`   ${b.date}: $${b.amount.toFixed(2)} - ${b.desc}`);
    missingDepositTotal += b.amount;
  });
  console.log(`   缺少總額: $${missingDepositTotal.toFixed(2)}`);

  console.log(`\n⚠️ 系統有但銀行沒有的收入: ${unmatchedSysIncome.length} 筆`);
  let extraIncomeTotal = 0;
  unmatchedSysIncome.forEach(s => {
    const amt = parseFloat(s.income_amount);
    console.log(`   ${s.transaction_date}: $${amt.toFixed(2)} - ${s.transaction_item?.substring(0,35)}`);
    extraIncomeTotal += amt;
  });
  console.log(`   額外總額: $${extraIncomeTotal.toFixed(2)}`);

  // Match withdrawals by amount
  console.log('\n\n【支出對比】\n');
  
  const unmatchedBankWithdrawals = [...bankWithdrawals];
  const unmatchedSysExpense = [...sysExpense];
  const matchedWithdrawals = [];

  for (let i = unmatchedSysExpense.length - 1; i >= 0; i--) {
    const sys = unmatchedSysExpense[i];
    const sysAmt = parseFloat(sys.expense_amount);
    
    const bankIdx = unmatchedBankWithdrawals.findIndex(b => Math.abs(b.amount - sysAmt) < 0.01);
    if (bankIdx !== -1) {
      const bank = unmatchedBankWithdrawals[bankIdx];
      matchedWithdrawals.push({ sys, bank, amount: sysAmt });
      unmatchedBankWithdrawals.splice(bankIdx, 1);
      unmatchedSysExpense.splice(i, 1);
    }
  }

  console.log(`✅ 金額相符的支出: ${matchedWithdrawals.length} 筆`);
  matchedWithdrawals.forEach(m => {
    console.log(`   $${m.amount.toFixed(2)} - 系統: ${m.sys.transaction_item?.substring(0,25)} | 銀行: ${m.bank.desc}`);
  });

  console.log(`\n❌ 銀行有但系統沒有的支出: ${unmatchedBankWithdrawals.length} 筆`);
  let missingExpenseTotal = 0;
  unmatchedBankWithdrawals.forEach(b => {
    console.log(`   ${b.date}: $${b.amount.toFixed(2)} - ${b.desc}`);
    missingExpenseTotal += b.amount;
  });
  console.log(`   缺少總額: $${missingExpenseTotal.toFixed(2)}`);
  console.log(`   FPS手續費: $${totalFpsFees} (銀行結單共${fpsFees.reduce((s,f)=>s+f.count,0)}筆)`);

  console.log(`\n⚠️ 系統有但銀行沒有的支出: ${unmatchedSysExpense.length} 筆`);
  let extraExpenseTotal = 0;
  unmatchedSysExpense.forEach(s => {
    const amt = parseFloat(s.expense_amount);
    console.log(`   ${s.transaction_date}: $${amt.toFixed(2)} - ${s.transaction_item?.substring(0,35)}`);
    extraExpenseTotal += amt;
  });
  console.log(`   額外總額: $${extraExpenseTotal.toFixed(2)}`);

  // Summary
  console.log('\n\n========================================');
  console.log('總結');
  console.log('========================================\n');
  
  const bankTotalDeposit = bankDeposits.reduce((s,b) => s + b.amount, 0);
  const bankTotalWithdraw = bankWithdrawals.reduce((s,b) => s + b.amount, 0) + totalFpsFees;
  const sysTotalIncome = sysIncome.reduce((s,t) => s + parseFloat(t.income_amount), 0);
  const sysTotalExpense = sysExpense.reduce((s,t) => s + parseFloat(t.expense_amount), 0);

  console.log('銀行結單:');
  console.log(`  存入: $${bankTotalDeposit.toFixed(2)}`);
  console.log(`  支出: $${bankTotalWithdraw.toFixed(2)} (含FPS費$${totalFpsFees})`);
  console.log(`  淨額: $${(bankTotalDeposit - bankTotalWithdraw).toFixed(2)}`);
  
  console.log('\n系統記錄:');
  console.log(`  收入: $${sysTotalIncome.toFixed(2)}`);
  console.log(`  支出: $${sysTotalExpense.toFixed(2)}`);
  console.log(`  淨額: $${(sysTotalIncome - sysTotalExpense).toFixed(2)}`);

  console.log('\n差異:');
  console.log(`  收入差異: $${(sysTotalIncome - bankTotalDeposit).toFixed(2)}`);
  console.log(`  支出差異: $${(sysTotalExpense - bankTotalWithdraw).toFixed(2)}`);
}

main().catch(console.error);
