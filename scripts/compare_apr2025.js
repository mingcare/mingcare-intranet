const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// Bank statement transactions (from the provided PDF)
const bankStatement = {
  // Withdrawals
  withdrawals: [
    { date: '02-Apr-25', amount: 1500, desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '03-Apr-25', amount: 14250, desc: 'Ho Ka Fung Candy (FPS) - 工資' },
    { date: '03-Apr-25', amount: 1500, desc: 'Leung Hui Fung (FPS) - 商務餐' },
    { date: '03-Apr-25', amount: 300, desc: 'Tang Kwok Hung (FPS)' },
    { date: '03-Apr-25', amount: 700, desc: 'Chick Ka Wai (FPS)' },
    { date: '03-Apr-25', amount: 6010, desc: 'Suen Ming Kuen (FPS)' },
    { date: '03-Apr-25', amount: 1250, desc: 'Kuang Qian Wen (FPS)' },
    { date: '03-Apr-25', amount: 1200, desc: 'Cheng Sau Chun (FPS)' },
    { date: '03-Apr-25', amount: 1490, desc: 'Wang Li Hong (FPS)' },
    { date: '03-Apr-25', amount: 5800, desc: 'Yu Chui Ying Ken (FPS)' },
    { date: '03-Apr-25', amount: 13470, desc: 'MINGCARE HOME (Internal Transfer to Cheque A/C)' },
    { date: '03-Apr-25', amount: 3430, desc: 'Lau Suet Nagi (FPS)' },
    { date: '03-Apr-25', amount: 1650, desc: 'Yu Yung Hsu (FPS)' },
    { date: '03-Apr-25', amount: 4200, desc: 'Yu Tsui King (FPS)' },
    { date: '03-Apr-25', amount: 450, desc: 'Wang Dong Ming (FPS)' },
    { date: '03-Apr-25', amount: 7120, desc: 'Pu Chunrong (FPS)' },
    { date: '03-Apr-25', amount: 4670, desc: 'Chu Tung Ping (FPS)' },
    { date: '03-Apr-25', amount: 2200, desc: 'Chuk Fung Sin (FPS)' },
    { date: '03-Apr-25', amount: 65, desc: 'FPS Fees (13 x $5)' },
    { date: '08-Apr-25', amount: 4000, desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '08-Apr-25', amount: 4160, desc: 'Yeung Yee On (FPS)' },
    { date: '08-Apr-25', amount: 2800, desc: 'Ho Ka Fung Candy (FPS)' },
    { date: '08-Apr-25', amount: 3000, desc: 'Ho Ka Fung Candy (FPS)' },
    { date: '08-Apr-25', amount: 15, desc: 'FPS Fees (3 x $5)' },
    { date: '15-Apr-25', amount: 19000, desc: 'Leung Pui Man Kanas (FPS) - 工資' },
    { date: '15-Apr-25', amount: 5, desc: 'FPS Fee' },
    { date: '24-Apr-25', amount: 75, desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '26-Apr-25', amount: 19000, desc: 'Cheung Kwun Ho (FPS) - 工資' },
    { date: '26-Apr-25', amount: 5, desc: 'FPS Fee' },
    { date: '30-Apr-25', amount: 638.24, desc: 'Kyocera Document Solutions' },
    { date: '30-Apr-25', amount: 11800, desc: 'Ruby Investment Ltd (Rent)' },
    { date: '30-Apr-25', amount: 10, desc: 'FPS Fees (2 x $5)' },
  ],
  // Deposits
  deposits: [
    { date: '02-Apr-25', amount: 7500, desc: 'MISS LAM SIU FONG (FPS)' },
    { date: '03-Apr-25', amount: 1040, desc: 'CHEQUE DEPOSIT 701210' },
    { date: '05-Apr-25', amount: 600, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '06-Apr-25', amount: 1800, desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '07-Apr-25', amount: 3430, desc: 'CR 1513RF1241291 (Refund/Return)' },
    { date: '07-Apr-25', amount: 1560, desc: 'YAU YUET WA ANRIQUE (FPS)' },
    { date: '08-Apr-25', amount: 50000, desc: 'MR YAU KIN NAM (FPS) - 股東資本' },
    { date: '12-Apr-25', amount: 1800, desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '13-Apr-25', amount: 300, desc: 'WONG HAU YEE (FPS)' },
    { date: '13-Apr-25', amount: 1800, desc: 'MISS CHAN MEI WING (FPS)' },
    { date: '13-Apr-25', amount: 330, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '13-Apr-25', amount: 300, desc: 'WONG HAU YEE (FPS)' },
    { date: '13-Apr-25', amount: 1200, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '14-Apr-25', amount: 330, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '14-Apr-25', amount: 300, desc: 'MR CHAN YIU MAN (FPS)' },
    { date: '14-Apr-25', amount: 300, desc: 'CHAN KA YAN (FPS)' },
    { date: '15-Apr-25', amount: 250, desc: 'MISS KWAN MAN KEE (FPS)' },
    { date: '16-Apr-25', amount: 720, desc: 'CHAN WING YAN (FPS)' },
    { date: '16-Apr-25', amount: 300, desc: 'NG PUI LIN CHIRISTLINE (FPS)' },
    { date: '17-Apr-25', amount: 1040, desc: 'YAU YUET WA ANRIQUE (FPS)' },
    { date: '18-Apr-25', amount: 1200, desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '19-Apr-25', amount: 300, desc: 'WONG MAN YEE (FPS)' },
    { date: '19-Apr-25', amount: 400, desc: 'MISS CHAN MEI WING (FPS)' },
    { date: '19-Apr-25', amount: 600, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '20-Apr-25', amount: 5525, desc: 'MR KWOK KAM TIM (FPS) - Steven?' },
    { date: '22-Apr-25', amount: 50, desc: 'WONG MAN YEE (FPS)' },
    { date: '23-Apr-25', amount: 900, desc: 'LEUNG, Pui Man Kanas (FPS)' },
    { date: '24-Apr-25', amount: 900, desc: 'LUI, Yuen Wan Vivian (FPS)' },
    { date: '25-Apr-25', amount: 1800, desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '26-Apr-25', amount: 9000, desc: 'MISS LAM SIU FONG (FPS)' },
    { date: '27-Apr-25', amount: 600, desc: 'LEE YUK CHUN (FPS)' },
    { date: '28-Apr-25', amount: 300, desc: 'MISS YAN KA WING (FPS)' },
    { date: '28-Apr-25', amount: 560, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '28-Apr-25', amount: 330, desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '28-Apr-25', amount: 10000, desc: 'SLASHER BUILDER LIMITED (FPS)' },
    { date: '29-Apr-25', amount: 750, desc: 'LEUNG PUI MAN KANAS (FPS)' },
    { date: '30-Apr-25', amount: 50000, desc: 'MR YAU KIN NAM (FPS) - 股東資本' },
    { date: '30-Apr-25', amount: 1858, desc: 'SLASHER BUILDER LIMITED (FPS)' },
    { date: '30-Apr-25', amount: 5.61, desc: 'INTEREST' },
  ]
};

async function main() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('billing_month', '2025年4月')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  // Calculate totals
  const bankTotalDeposits = bankStatement.deposits.reduce((s, t) => s + t.amount, 0);
  const bankTotalWithdrawals = bankStatement.withdrawals.reduce((s, t) => s + t.amount, 0);
  
  let sysIncome = 0, sysExpense = 0;
  data.forEach(t => {
    sysIncome += parseFloat(t.income_amount) || 0;
    sysExpense += parseFloat(t.expense_amount) || 0;
  });

  console.log('========================================');
  console.log('2025年4月 銀行轉賬對賬報告');
  console.log('========================================\n');

  console.log('【銀行結單摘要】');
  console.log(`  總存入 (Deposits): $${bankTotalDeposits.toFixed(2)}`);
  console.log(`  總支出 (Withdrawals): $${bankTotalWithdrawals.toFixed(2)}`);
  console.log(`  淨變化: $${(bankTotalDeposits - bankTotalWithdrawals).toFixed(2)}`);
  console.log(`  開戶結餘: $82,755.59`);
  console.log(`  結單結餘: $103,530.96`);
  console.log(`  實際淨變化: $20,775.37`);

  console.log('\n【系統記錄摘要】(2025-04-01 至 2025-04-30)');
  console.log(`  總收入: $${sysIncome.toFixed(2)}`);
  console.log(`  總支出: $${sysExpense.toFixed(2)}`);
  console.log(`  淨額: $${(sysIncome - sysExpense).toFixed(2)}`);

  console.log('\n【差異分析】');
  console.log(`  銀行存入 vs 系統收入: $${(bankTotalDeposits - sysIncome).toFixed(2)}`);
  console.log(`  銀行支出 vs 系統支出: $${(bankTotalWithdrawals - sysExpense).toFixed(2)}`);

  // Find missing items
  console.log('\n========================================');
  console.log('銀行結單有但系統可能缺少的項目:');
  console.log('========================================\n');

  console.log('【銀行存入項目】');
  bankStatement.deposits.forEach(d => {
    console.log(`  ${d.date}: $${d.amount.toFixed(2)} - ${d.desc}`);
  });

  console.log('\n【銀行支出項目】(不含FPS手續費)');
  bankStatement.withdrawals.filter(w => !w.desc.includes('FPS Fee')).forEach(w => {
    console.log(`  ${w.date}: $${w.amount.toFixed(2)} - ${w.desc}`);
  });

  // Summary of what's missing
  console.log('\n========================================');
  console.log('關鍵差異項目:');
  console.log('========================================\n');
  
  // 03-Apr salary payments not in system as expense
  const mar03Salaries = [
    { name: 'Ho Ka Fung Candy', amount: 14250 },
    { name: 'Leung Hui Fung', amount: 1500 },
    { name: 'Tang Kwok Hung', amount: 300 },
    { name: 'Chick Ka Wai', amount: 700 },
    { name: 'Suen Ming Kuen', amount: 6010 },
    { name: 'Kuang Qian Wen', amount: 1250 },
    { name: 'Cheng Sau Chun', amount: 1200 },
    { name: 'Wang Li Hong', amount: 1490 },
    { name: 'Yu Chui Ying Ken', amount: 5800 },
    { name: 'Lau Suet Nagi', amount: 3430 },
    { name: 'Yu Yung Hsu', amount: 1650 },
    { name: 'Yu Tsui King', amount: 4200 },
    { name: 'Wang Dong Ming', amount: 450 },
    { name: 'Pu Chunrong', amount: 7120 },
    { name: 'Chu Tung Ping', amount: 4670 },
    { name: 'Chuk Fung Sin', amount: 2200 },
    { name: 'Yeung Yee On (08-Apr)', amount: 4160 },
    { name: 'Ho Ka Fung Candy (08-Apr)', amount: 2800 },
    { name: 'Ho Ka Fung Candy (08-Apr)', amount: 3000 },
  ];
  
  const totalMar03Salaries = mar03Salaries.reduce((s, t) => s + t.amount, 0);
  console.log(`3月份工資支出 (在4月3日及8日支付): $${totalMar03Salaries.toFixed(2)}`);
  console.log('這些是3月份護理人員工資,應記在3月份會計月份\n');

  // AIA insurance
  console.log('AIA保險支出:');
  console.log('  02-Apr: $1,500');
  console.log('  08-Apr: $4,000');
  console.log('  24-Apr: $75 (系統有記錄)');
  console.log('  系統缺少: $5,500 AIA保險\n');

  // Rent
  console.log('租金:');
  console.log('  銀行結單 30-Apr: $11,800 (Ruby Investment Ltd)');
  console.log('  系統記錄: 未在4月transaction_date找到租金支出\n');

  // FPS Fees  
  const totalFpsFees = 65 + 15 + 5 + 5 + 10;
  console.log(`FPS手續費總計: $${totalFpsFees} (系統記錄: $110)`);
}

main().catch(console.error);
