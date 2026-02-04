const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== 比對5月份收入記錄 ===\n');
  
  // 銀行結單所有收入（從 statement 提取）
  const bankDeposits = [
    { date: '01-May', amount: 750, desc: 'LEUNG PUI MAN KANAS' },
    { date: '02-May', amount: 50, desc: 'LEE YUK CHUN' },
    { date: '02-May', amount: 50000, desc: 'MR YAU KIN NAM' },
    { date: '02-May', amount: 700, desc: 'MISS CHAN MEI WING' },
    { date: '03-May', amount: 220, desc: 'MR YIP CHU LEUNG' },
    { date: '03-May', amount: 1800, desc: 'MISS HO TAK CHUI' },
    { date: '04-May', amount: 550, desc: 'MISS LO LAI MING IRENE' },
    { date: '05-May', amount: 330, desc: 'CHOI IOI MAN' },
    { date: '06-May', amount: 330, desc: 'WONG LOK CHING' },
    { date: '06-May', amount: 110, desc: 'CHOI IOI MAN' },
    { date: '07-May', amount: 50000, desc: 'MR YAU KIN NAM' },
    { date: '08-May', amount: 50000, desc: 'MR YAU KIN NAM' },
    { date: '10-May', amount: 1800, desc: 'MISS HO TAK CHUI' },
    { date: '11-May', amount: 720, desc: 'CHOI IOI MAN' },
    { date: '13-May', amount: 55, desc: 'MISS WONG LOK CHING' },
    { date: '13-May', amount: 60, desc: 'CHOI IOI MAN' },
    { date: '13-May', amount: 650, desc: 'MS WANG YUQIN' },
    { date: '14-May', amount: 3120, desc: 'WONG SZE MAN SIMONA' },
    { date: '14-May', amount: 330, desc: 'MR YIP CHU LEUNG' },
    { date: '16-May', amount: 800, desc: 'MISS CHAN MEI WING' },
    { date: '16-May', amount: 1800, desc: 'MISS HO TAK CHUI' },
    { date: '19-May', amount: 450, desc: 'MISS HO TAK CHUI' },
    { date: '20-May', amount: 450, desc: 'MISS WONG MAN YEE' },
    { date: '21-May', amount: 300, desc: 'MISS YAN KA WING' },
    { date: '22-May', amount: 700, desc: 'CHAN MEI WING' },
    { date: '22-May', amount: 390, desc: 'CHOI IOI MAN' },
    { date: '22-May', amount: 3120, desc: 'LAW SUET FAN' },
    { date: '23-May', amount: 300, desc: 'LEUNG, Pui Man Kanas' },
    { date: '24-May', amount: 2250, desc: 'MISS HO TAK CHUI' },
    { date: '25-May', amount: 10000, desc: 'SLASHER BUILDER LIMITED' },
    { date: '26-May', amount: 9560, desc: 'SLASHER BUILDER LIMITED' },
    { date: '27-May', amount: 9750, desc: 'MISS LAM SIU FONG' },
    { date: '29-May', amount: 3900, desc: 'LAW SUET FAN' },
    { date: '30-May', amount: 330, desc: 'MR YIP CHU LEUNG' },
    { date: '30-May', amount: 390, desc: 'CHOI IOI MAN' },
    { date: '31-May', amount: 6.57, desc: 'INTEREST' },
  ];
  
  const bankTotal = bankDeposits.reduce((sum, d) => sum + d.amount, 0);
  console.log(`銀行結單總收入: $${bankTotal.toFixed(2)}`);
  
  // 數據庫記錄
  const { data: dbRecords } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gt('income_amount', 0)
    .order('transaction_date')
    .order('income_amount');
  
  const dbTotal = dbRecords.reduce((sum, r) => sum + Number(r.income_amount), 0);
  console.log(`數據庫總收入: $${dbTotal.toFixed(2)}`);
  console.log(`差異: $${(dbTotal - bankTotal).toFixed(2)}\n`);
  
  // 列出所有數據庫收入記錄
  console.log('=== 數據庫收入記錄 ===');
  dbRecords.forEach(r => {
    console.log(`${r.transaction_date} | $${Number(r.income_amount).toFixed(2).padStart(10)} | ${r.journal_number} | ${r.transaction_item.substring(0, 40)}`);
  });
  
  // 按金額分組比較
  console.log('\n=== 按金額比較 ===');
  const bankByAmount = {};
  bankDeposits.forEach(d => {
    if (!bankByAmount[d.amount]) bankByAmount[d.amount] = 0;
    bankByAmount[d.amount]++;
  });
  
  const dbByAmount = {};
  dbRecords.forEach(r => {
    const amt = Number(r.income_amount);
    if (!dbByAmount[amt]) dbByAmount[amt] = 0;
    dbByAmount[amt]++;
  });
  
  // 找出差異
  const allAmounts = new Set([...Object.keys(bankByAmount), ...Object.keys(dbByAmount)]);
  console.log('\n金額        | 銀行 | DB  | 差異');
  console.log('-'.repeat(40));
  
  let diffDetails = [];
  allAmounts.forEach(amt => {
    const bankCount = bankByAmount[amt] || 0;
    const dbCount = dbByAmount[amt] || 0;
    if (bankCount !== dbCount) {
      console.log(`$${Number(amt).toFixed(2).padStart(10)} | ${bankCount.toString().padStart(4)} | ${dbCount.toString().padStart(3)} | ${dbCount - bankCount > 0 ? '+' : ''}${dbCount - bankCount}`);
      if (dbCount > bankCount) {
        diffDetails.push({ amount: Number(amt), extra: dbCount - bankCount });
      }
    }
  });
  
  console.log('\n=== 數據庫多出嘅記錄 ===');
  diffDetails.forEach(d => {
    const records = dbRecords.filter(r => Number(r.income_amount) === d.amount);
    console.log(`\n$${d.amount} 有 ${d.extra} 筆多出:`);
    records.forEach(r => {
      console.log(`  ${r.journal_number} | ${r.transaction_date} | ${r.transaction_item}`);
    });
  });
})();
