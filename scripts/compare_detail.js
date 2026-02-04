const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 銀行結單存入 (按日期順序)
const bankDeposits = [
  { date: '02-Apr', amt: 7500, desc: 'CHAN YIN LUN' },
  { date: '05-Apr', amt: 1040, desc: 'WONG OI YING' },
  { date: '05-Apr', amt: 600, desc: 'LAM TSUI YIN' },
  { date: '06-Apr', amt: 1800, desc: 'TSE PUI KI' },
  { date: '07-Apr', amt: 3430, desc: 'CR Refund' },
  { date: '08-Apr', amt: 1560, desc: 'FAN KAM CHING' },
  { date: '08-Apr', amt: 50000, desc: 'MingCare' },
  { date: '12-Apr', amt: 1800, desc: 'CHAN MAN WAI' },
  { date: '13-Apr', amt: 300, desc: 'LO LAI PING' },
  { date: '13-Apr', amt: 1800, desc: 'WONG YUK FONG' },
  { date: '13-Apr', amt: 330, desc: 'LAI YIN CHING' },
  { date: '13-Apr', amt: 300, desc: 'LAU MEI CHU' },
  { date: '13-Apr', amt: 1200, desc: 'WONG SIU FUNG' },
  { date: '14-Apr', amt: 330, desc: 'MOK LAI MUI' },
  { date: '14-Apr', amt: 300, desc: 'LAI SHUET YING' },
  { date: '14-Apr', amt: 300, desc: 'FAN WING LING' },
  { date: '15-Apr', amt: 250, desc: 'CHOI YUK PING' },
  { date: '16-Apr', amt: 720, desc: 'CHAN KA SIN' },
  { date: '16-Apr', amt: 300, desc: 'CHAN HUNG LING' },
  { date: '17-Apr', amt: 1040, desc: 'YAU YUET WA' },
  { date: '18-Apr', amt: 1200, desc: 'CHAN MAN WAI' },
  { date: '19-Apr', amt: 300, desc: 'LO LAI PING' },
  { date: '19-Apr', amt: 400, desc: 'LIU MAN YI' },
  { date: '19-Apr', amt: 600, desc: 'TSANG KWOK YIN' },
  { date: '20-Apr', amt: 5525, desc: 'KWOK KAM TIM' },
  { date: '22-Apr', amt: 50, desc: 'IP MUI' },
  { date: '23-Apr', amt: 900, desc: 'LAI SIU WAI' },
  { date: '24-Apr', amt: 900, desc: 'WONG WING YAN' },
  { date: '25-Apr', amt: 1800, desc: 'LAU CHI KWAN' },
  { date: '26-Apr', amt: 9000, desc: 'LAM SIU FONG' },
  { date: '27-Apr', amt: 600, desc: 'LAM TSUI YIN' },
  { date: '28-Apr', amt: 300, desc: 'YEUNG SHUK HAN' },
  { date: '28-Apr', amt: 560, desc: 'WONG LAI HAN' },
  { date: '28-Apr', amt: 330, desc: 'MA SHAU KIU' },
  { date: '29-Apr', amt: 10000, desc: 'WONG SIU FUNG' },
  { date: '29-Apr', amt: 750, desc: 'WONG PO KING' },
  { date: '30-Apr', amt: 50000, desc: 'MingCare' },
  { date: '30-Apr', amt: 1858, desc: 'SLASHER' },
  { date: '30-Apr', amt: 5.61, desc: 'Interest' },
];

// 銀行結單支出 (按日期順序，不含FPS手續費)
const bankWithdrawals = [
  { date: '02-Apr', amt: 1500, desc: '梁玉蓮' },
  { date: '03-Apr', amt: 14250, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 1500, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 300, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 700, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 6010, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 1250, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 1200, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 1490, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 5800, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 13470, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 3430, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 1650, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 4200, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 450, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 7120, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 4670, desc: '護理員3月份工資' },
  { date: '03-Apr', amt: 2200, desc: '護理員3月份工資' },
  { date: '08-Apr', amt: 4000, desc: '陳秀珍' },
  { date: '08-Apr', amt: 4160, desc: '甄錦英' },
  { date: '08-Apr', amt: 2800, desc: '詹珍' },
  { date: '08-Apr', amt: 3000, desc: '周少鳳' },
  { date: '15-Apr', amt: 19000, desc: 'Lo Man' },
  { date: '24-Apr', amt: 75, desc: 'AIA' },
  { date: '26-Apr', amt: 19000, desc: '鄧嘉敏' },
  { date: '30-Apr', amt: 638.24, desc: 'DBS' },
  { date: '30-Apr', amt: 11800, desc: '辛紹亮' },
];

// FPS手續費 20筆 x $5 = $100
const bankFpsFees = [
  { date: '03-Apr', amt: 5, count: 17 }, // 03-Apr 有17筆工資轉賬
  { date: '08-Apr', amt: 5, count: 3 },  // 08-Apr 有3筆
  // 其他日期可能有
];

async function main() {
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

  const dbIncomes = data.filter(t => parseFloat(t.income_amount) > 0);
  const dbExpenses = data.filter(t => parseFloat(t.expense_amount) > 0);

  console.log('='.repeat(80));
  console.log('【存入/收入】逐筆對比');
  console.log('='.repeat(80));
  
  // 建立database收入 map (用金額+日期)
  const dbIncomeList = dbIncomes.map(t => ({
    date: t.transaction_date,
    amt: parseFloat(t.income_amount),
    item: t.item_name,
    matched: false
  }));

  const bankDepList = bankDeposits.map(b => ({
    ...b,
    matched: false,
    dbMatch: null
  }));

  // 對比
  for (let bd of bankDepList) {
    const bdDate = bd.date; // e.g. '02-Apr'
    const bdDateNum = parseInt(bdDate.split('-')[0]);
    const dbDateStr = `2025-04-${bdDateNum.toString().padStart(2, '0')}`;
    
    // 搵同日期同金額嘅database記錄
    const matchIdx = dbIncomeList.findIndex(di => 
      di.date === dbDateStr && 
      Math.abs(di.amt - bd.amt) < 0.01 && 
      !di.matched
    );
    
    if (matchIdx !== -1) {
      bd.matched = true;
      bd.dbMatch = dbIncomeList[matchIdx];
      dbIncomeList[matchIdx].matched = true;
    }
  }

  console.log('\n銀行結單存入：');
  for (let bd of bankDepList) {
    const status = bd.matched ? '✅' : '❌';
    console.log(`${status} ${bd.date} | $${bd.amt.toFixed(2).padStart(10)} | ${bd.desc}`);
    if (!bd.matched) {
      console.log(`   ⚠️ Database冇呢筆！`);
    }
  }

  console.log('\nDatabase收入：');
  for (let di of dbIncomeList) {
    const status = di.matched ? '✅' : '⚠️';
    const dateDisplay = di.date.replace('2025-04-', '').replace(/^0/, '') + '-Apr';
    console.log(`${status} ${dateDisplay.padEnd(6)} | $${di.amt.toFixed(2).padStart(10)} | ${di.item || '(no name)'}`);
    if (!di.matched) {
      console.log(`   ⚠️ 銀行結單冇呢筆！`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('【支出】逐筆對比');
  console.log('='.repeat(80));

  const dbExpenseList = dbExpenses.map(t => ({
    date: t.transaction_date,
    amt: parseFloat(t.expense_amount),
    item: t.item_name,
    matched: false
  }));

  const bankWithList = bankWithdrawals.map(b => ({
    ...b,
    matched: false,
    dbMatch: null
  }));

  // 對比
  for (let bw of bankWithList) {
    const bwDate = bw.date;
    const bwDateNum = parseInt(bwDate.split('-')[0]);
    const dbDateStr = `2025-04-${bwDateNum.toString().padStart(2, '0')}`;
    
    const matchIdx = dbExpenseList.findIndex(de => 
      de.date === dbDateStr && 
      Math.abs(de.amt - bw.amt) < 0.01 && 
      !de.matched
    );
    
    if (matchIdx !== -1) {
      bw.matched = true;
      bw.dbMatch = dbExpenseList[matchIdx];
      dbExpenseList[matchIdx].matched = true;
    }
  }

  console.log('\n銀行結單支出（不含FPS手續費）：');
  for (let bw of bankWithList) {
    const status = bw.matched ? '✅' : '❌';
    console.log(`${status} ${bw.date} | $${bw.amt.toFixed(2).padStart(10)} | ${bw.desc}`);
    if (!bw.matched) {
      console.log(`   ⚠️ Database冇呢筆！`);
    }
  }

  console.log('\nDatabase支出：');
  for (let de of dbExpenseList) {
    const status = de.matched ? '✅' : '⚠️';
    const dateDisplay = de.date.replace('2025-04-', '').replace(/^0/, '') + '-Apr';
    console.log(`${status} ${dateDisplay.padEnd(6)} | $${de.amt.toFixed(2).padStart(10)} | ${de.item || '(no name)'}`);
    if (!de.matched) {
      console.log(`   ⚠️ 銀行結單冇呢筆！`);
    }
  }

  // 總結
  console.log('\n' + '='.repeat(80));
  console.log('總結');
  console.log('='.repeat(80));
  
  const unmatchedBankDep = bankDepList.filter(b => !b.matched);
  const unmatchedDbInc = dbIncomeList.filter(d => !d.matched);
  const unmatchedBankWith = bankWithList.filter(b => !b.matched);
  const unmatchedDbExp = dbExpenseList.filter(d => !d.matched);

  console.log(`\n【存入/收入】`);
  console.log(`銀行: ${bankDepList.length}筆，Database: ${dbIncomeList.length}筆`);
  if (unmatchedBankDep.length > 0) {
    console.log(`❌ 銀行有但Database冇: ${unmatchedBankDep.length}筆`);
    unmatchedBankDep.forEach(b => console.log(`   ${b.date} $${b.amt} ${b.desc}`));
  }
  if (unmatchedDbInc.length > 0) {
    console.log(`⚠️ Database有但銀行冇: ${unmatchedDbInc.length}筆`);
    unmatchedDbInc.forEach(d => console.log(`   ${d.date} $${d.amt} ${d.item}`));
  }

  console.log(`\n【支出】`);
  console.log(`銀行: ${bankWithList.length}筆，Database: ${dbExpenseList.length}筆`);
  console.log(`銀行FPS手續費: $100 (20筆x$5)`);
  
  // 搵database嘅FPS手續費
  const dbFee = dbExpenseList.find(d => d.amt === 110 || d.amt === 100);
  if (dbFee) {
    console.log(`Database FPS手續費: $${dbFee.amt}`);
  }
  
  if (unmatchedBankWith.length > 0) {
    console.log(`❌ 銀行有但Database冇: ${unmatchedBankWith.length}筆`);
    unmatchedBankWith.forEach(b => console.log(`   ${b.date} $${b.amt} ${b.desc}`));
  }
  if (unmatchedDbExp.length > 0) {
    console.log(`⚠️ Database有但銀行冇: ${unmatchedDbExp.length}筆`);
    unmatchedDbExp.forEach(d => console.log(`   ${d.date} $${d.amt} ${d.item}`));
  }
}

main().catch(console.error);
