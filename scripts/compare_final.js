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

// 銀行結單支出 (不含FPS手續費)
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

async function main() {
  // 查詢所有 transaction_date 在 2025年4月 + 銀行轉賬（唔理 billing_month）
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

  console.log('='.repeat(100));
  console.log('Database 2025年4月 銀行轉賬（所有 billing_month）');
  console.log('='.repeat(100));
  console.log(`總筆數: ${data.length}\n`);

  // 分開收入支出
  const dbIncomes = data.filter(t => parseFloat(t.income_amount) > 0);
  const dbExpenses = data.filter(t => parseFloat(t.expense_amount) > 0);

  // ===== 收入對比 =====
  console.log('【存入/收入】');
  console.log('-'.repeat(100));
  
  const dbIncomeList = dbIncomes.map(t => ({
    journal: t.journal_number,
    date: t.transaction_date,
    dateNum: parseInt(t.transaction_date.split('-')[2]),
    amt: parseFloat(t.income_amount),
    billing: t.billing_month,
    item: t.transaction_item,
    matched: false
  }));

  const bankDepList = bankDeposits.map(b => ({
    ...b,
    dateNum: parseInt(b.date.split('-')[0]),
    matched: false
  }));

  // Match by date + amount
  for (let bd of bankDepList) {
    const matchIdx = dbIncomeList.findIndex(di => 
      di.dateNum === bd.dateNum && 
      Math.abs(di.amt - bd.amt) < 0.01 && 
      !di.matched
    );
    if (matchIdx !== -1) {
      bd.matched = true;
      bd.dbMatch = dbIncomeList[matchIdx];
      dbIncomeList[matchIdx].matched = true;
    }
  }

  console.log('\n銀行結單:');
  for (let bd of bankDepList) {
    const status = bd.matched ? '✅' : '❌';
    const dbInfo = bd.dbMatch ? `→ ${bd.dbMatch.journal} (${bd.dbMatch.billing})` : '❌ 冇對應';
    console.log(`${status} ${bd.date.padEnd(7)} $${bd.amt.toString().padStart(8)} ${bd.desc.padEnd(20)} ${dbInfo}`);
  }

  console.log('\nDatabase:');
  for (let di of dbIncomeList) {
    const status = di.matched ? '✅' : '⚠️';
    const dateStr = di.date.split('-')[2] + '-Apr';
    console.log(`${status} ${dateStr.padEnd(7)} $${di.amt.toString().padStart(8)} ${di.journal} (${di.billing.padEnd(10)}) ${di.item?.substring(0,30) || ''}`);
  }

  // ===== 支出對比 =====
  console.log('\n\n【支出】');
  console.log('-'.repeat(100));

  const dbExpenseList = dbExpenses.map(t => ({
    journal: t.journal_number,
    date: t.transaction_date,
    dateNum: parseInt(t.transaction_date.split('-')[2]),
    amt: parseFloat(t.expense_amount),
    billing: t.billing_month,
    item: t.transaction_item,
    matched: false
  }));

  const bankWithList = bankWithdrawals.map(b => ({
    ...b,
    dateNum: parseInt(b.date.split('-')[0]),
    matched: false
  }));

  for (let bw of bankWithList) {
    const matchIdx = dbExpenseList.findIndex(de => 
      de.dateNum === bw.dateNum && 
      Math.abs(de.amt - bw.amt) < 0.01 && 
      !de.matched
    );
    if (matchIdx !== -1) {
      bw.matched = true;
      bw.dbMatch = dbExpenseList[matchIdx];
      dbExpenseList[matchIdx].matched = true;
    }
  }

  console.log('\n銀行結單:');
  for (let bw of bankWithList) {
    const status = bw.matched ? '✅' : '❌';
    const dbInfo = bw.dbMatch ? `→ ${bw.dbMatch.journal} (${bw.dbMatch.billing})` : '❌ 冇對應';
    console.log(`${status} ${bw.date.padEnd(7)} $${bw.amt.toString().padStart(8)} ${bw.desc.padEnd(20)} ${dbInfo}`);
  }

  console.log('\nDatabase:');
  for (let de of dbExpenseList) {
    const status = de.matched ? '✅' : '⚠️';
    const dateStr = de.date.split('-')[2] + '-Apr';
    console.log(`${status} ${dateStr.padEnd(7)} $${de.amt.toString().padStart(8)} ${de.journal} (${de.billing.padEnd(10)}) ${de.item?.substring(0,30) || ''}`);
  }

  // ===== 總結 =====
  console.log('\n\n' + '='.repeat(100));
  console.log('總結');
  console.log('='.repeat(100));
  
  const unmatchedBank = bankDepList.filter(b => !b.matched);
  const unmatchedDb = dbIncomeList.filter(d => !d.matched);
  const unmatchedBankW = bankWithList.filter(b => !b.matched);
  const unmatchedDbW = dbExpenseList.filter(d => !d.matched);

  console.log(`\n【存入/收入】銀行: ${bankDepList.length}筆 | Database: ${dbIncomeList.length}筆`);
  if (unmatchedBank.length === 0 && unmatchedDb.length === 0) {
    console.log('✅ 全部 MATCH！');
  } else {
    if (unmatchedBank.length > 0) {
      console.log(`❌ 銀行有但Database冇: ${unmatchedBank.length}筆`);
      unmatchedBank.forEach(b => console.log(`   ${b.date} $${b.amt} ${b.desc}`));
    }
    if (unmatchedDb.length > 0) {
      console.log(`⚠️ Database有但銀行冇: ${unmatchedDb.length}筆`);
      unmatchedDb.forEach(d => console.log(`   ${d.date} $${d.amt} ${d.journal} ${d.item?.substring(0,20)}`));
    }
  }

  console.log(`\n【支出】銀行: ${bankWithList.length}筆 | Database: ${dbExpenseList.length}筆`);
  if (unmatchedBankW.length === 0 && unmatchedDbW.length === 0) {
    console.log('✅ 全部 MATCH！');
  } else {
    if (unmatchedBankW.length > 0) {
      console.log(`❌ 銀行有但Database冇: ${unmatchedBankW.length}筆`);
      unmatchedBankW.forEach(b => console.log(`   ${b.date} $${b.amt} ${b.desc}`));
    }
    if (unmatchedDbW.length > 0) {
      console.log(`⚠️ Database有但銀行冇: ${unmatchedDbW.length}筆`);
      unmatchedDbW.forEach(d => console.log(`   ${d.date} $${d.amt} ${d.journal} ${d.item?.substring(0,20)}`));
    }
  }

  // FPS 手續費
  const fpsFee = dbExpenseList.find(d => d.amt === 110 || d.amt === 100);
  if (fpsFee) {
    console.log(`\n📝 FPS手續費: Database ${fpsFee.journal} $${fpsFee.amt} vs 銀行 $100 (20筆x$5)`);
  }
}

main().catch(console.error);
