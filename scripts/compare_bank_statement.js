const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// Bank statement transactions (April 2025 HKD only)
const bankStatement = [
  // Withdrawals (支出)
  { date: '2025-04-02', amount: -1500, desc: 'AIA CO (T) LTD - P E6MK04' },
  { date: '2025-04-03', amount: -14250, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-04-03', amount: -1500, desc: 'FPS Leung Hui Fung' },
  { date: '2025-04-03', amount: -300, desc: 'FPS Tang Kwok Hung' },
  { date: '2025-04-03', amount: -700, desc: 'FPS Chick Ka Wai' },
  { date: '2025-04-03', amount: -6010, desc: 'FPS Suen Ming Kuen' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -1250, desc: 'FPS Kuang Qian Wen' },
  { date: '2025-04-03', amount: -1200, desc: 'FPS Cheng Sau Chun' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -1490, desc: 'FPS Wang Li Hong' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5800, desc: 'FPS Yu Chui Ying Ken' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -13470, desc: 'DR MINGCARE HOME HEALTH SERVICES' },
  { date: '2025-04-03', amount: -3430, desc: 'FPS Lau Suet Nagi' },
  { date: '2025-04-03', amount: -1650, desc: 'FPS Yu Yung Hsu' },
  { date: '2025-04-03', amount: -4200, desc: 'FPS Yu Tsui King' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -450, desc: 'FPS Wang Dong Ming' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -7120, desc: 'FPS Pu Chunrong' },
  { date: '2025-04-03', amount: -4670, desc: 'FPS Chu Tung Ping' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-03', amount: -2200, desc: 'FPS Chuk Fung Sin' },
  { date: '2025-04-03', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-08', amount: -4000, desc: 'AIA CO (T) LTD - P E6MK04' },
  { date: '2025-04-08', amount: -4160, desc: 'FPS Yeung Yee On' },
  { date: '2025-04-08', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-08', amount: -2800, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-04-08', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-08', amount: -3000, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-04-08', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-15', amount: -19000, desc: 'FPS Leung Pui Man Kanas' },
  { date: '2025-04-15', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-24', amount: -75, desc: 'AIA CO (T) LTD - P E6MK04' },
  { date: '2025-04-26', amount: -19000, desc: 'FPS Cheung Kwun Ho' },
  { date: '2025-04-26', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-30', amount: -638.24, desc: 'FPS Kyocera Document Solutions' },
  { date: '2025-04-30', amount: -11800, desc: 'FPS Ruby Investment Ltd' },
  { date: '2025-04-30', amount: -5, desc: 'FPS FEE' },
  { date: '2025-04-30', amount: -5, desc: 'FPS FEE' },
  
  // Deposits (收入)
  { date: '2025-04-02', amount: 7500, desc: 'FPS MISS LAM SIU FONG' },
  { date: '2025-04-03', amount: 1650, desc: 'REV FPS DEPOSIT (returned payment)' },
  { date: '2025-04-03', amount: 1040, desc: 'OUTWARD CLEARING cheque' },
  { date: '2025-04-03', amount: 4200, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-03', amount: 2200, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-03', amount: 4670, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-03', amount: 450, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-03', amount: 7120, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-03', amount: 2200, desc: 'REV FPS DEPOSIT' },
  { date: '2025-04-05', amount: 600, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-06', amount: 1800, desc: 'FPS MISS HO TAK CHUI' },
  { date: '2025-04-07', amount: 3430, desc: 'CR (credit reversal)' },
  { date: '2025-04-07', amount: 1560, desc: 'FPS YAU YUET WA ANRIQUE' },
  { date: '2025-04-08', amount: 50000, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-04-12', amount: 1800, desc: 'FPS MISS HO TAK CHUI' },
  { date: '2025-04-13', amount: 300, desc: 'FPS WONG HAU YEE' },
  { date: '2025-04-13', amount: 1800, desc: 'FPS MISS CHAN MEI WING' },
  { date: '2025-04-13', amount: 330, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-13', amount: 300, desc: 'FPS WONG HAU YEE' },
  { date: '2025-04-13', amount: 1200, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-14', amount: 330, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-14', amount: 300, desc: 'FPS MR CHAN YIU MAN' },
  { date: '2025-04-14', amount: 300, desc: 'FPS CHAN KA YAN' },
  { date: '2025-04-15', amount: 250, desc: 'FPS MISS KWAN MAN KEE' },
  { date: '2025-04-16', amount: 720, desc: 'FPS CHAN WING YAN' },
  { date: '2025-04-16', amount: 300, desc: 'FPS NG PUI LIN CHIRISTLINE' },
  { date: '2025-04-17', amount: 1040, desc: 'FPS YAU YUET WA ANRIQUE' },
  { date: '2025-04-18', amount: 1200, desc: 'FPS MISS HO TAK CHUI' },
  { date: '2025-04-19', amount: 300, desc: 'FPS WONG MAN YEE' },
  { date: '2025-04-19', amount: 400, desc: 'FPS MISS CHAN MEI WING' },
  { date: '2025-04-19', amount: 600, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-20', amount: 5525, desc: 'FPS MR KWOK KAM TIM' },
  { date: '2025-04-22', amount: 50, desc: 'FPS WONG MAN YEE' },
  { date: '2025-04-23', amount: 900, desc: 'FPS LEUNG, Pui Man Kanas' },
  { date: '2025-04-24', amount: 900, desc: 'FPS LUI, Yuen Wan Vivian' },
  { date: '2025-04-25', amount: 1800, desc: 'FPS MISS HO TAK CHUI' },
  { date: '2025-04-26', amount: 9000, desc: 'FPS MISS LAM SIU FONG' },
  { date: '2025-04-27', amount: 600, desc: 'FPS LEE YUK CHUN' },
  { date: '2025-04-28', amount: 300, desc: 'FPS MISS YAN KA WING' },
  { date: '2025-04-28', amount: 560, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-28', amount: 330, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-04-28', amount: 10000, desc: 'FPS SLASHER BUILDER LIMITED' },
  { date: '2025-04-29', amount: 750, desc: 'FPS LEUNG PUI MAN KANAS' },
  { date: '2025-04-30', amount: 50000, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-04-30', amount: 1858, desc: 'FPS SLASHER BUILDER LIMITED' },
  { date: '2025-04-30', amount: 5.61, desc: 'INTEREST POSTING' },
];

async function main() {
  // Get all April 2025 transactions with bank transfer payment method
  // Only those with transaction_date in April 2025
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // 排除手續費，只用金額對比
  const bankAmounts = {};
  bankStatement.forEach(t => {
    // 排除 FPS FEE 手續費
    if (t.desc.includes('FPS FEE')) return;
    
    const amt = Math.abs(t.amount).toFixed(2);
    const type = t.amount >= 0 ? '收入' : '支出';
    const key = `${type}_${amt}`;
    if (!bankAmounts[key]) bankAmounts[key] = [];
    bankAmounts[key].push(t);
  });

  const dbAmounts = {};
  data.forEach(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    
    // 排除手續費
    if (t.transaction_item && t.transaction_item.includes('手續費')) return;
    
    if (income > 0) {
      const key = `收入_${income.toFixed(2)}`;
      if (!dbAmounts[key]) dbAmounts[key] = [];
      dbAmounts[key].push({ ...t, amt: income, type: '收入' });
    }
    if (expense > 0) {
      const key = `支出_${expense.toFixed(2)}`;
      if (!dbAmounts[key]) dbAmounts[key] = [];
      dbAmounts[key].push({ ...t, amt: expense, type: '支出' });
    }
  });

  console.log('=========================================');
  console.log('  用金額對比 (排除手續費)');
  console.log('=========================================\n');

  // 銀行有但數據庫沒有
  console.log('🔴 銀行有，數據庫沒有：');
  console.log('─────────────────────────────────────────');
  
  const bankOnly = [];
  Object.keys(bankAmounts).forEach(key => {
    const bankCount = bankAmounts[key].length;
    const dbCount = (dbAmounts[key] || []).length;
    const diff = bankCount - dbCount;
    
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        bankOnly.push(bankAmounts[key][i]);
      }
    }
  });

  bankOnly.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  bankOnly.forEach(t => {
    const type = t.amount >= 0 ? '收入' : '支出';
    console.log(`${type} $${Math.abs(t.amount).toFixed(2).padStart(10)} | ${t.date} | ${t.desc}`);
  });

  // 數據庫有但銀行沒有
  console.log('\n\n🔵 數據庫有，銀行沒有：');
  console.log('─────────────────────────────────────────');
  
  const dbOnly = [];
  Object.keys(dbAmounts).forEach(key => {
    const dbCount = dbAmounts[key].length;
    const bankCount = (bankAmounts[key] || []).length;
    const diff = dbCount - bankCount;
    
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        dbOnly.push(dbAmounts[key][i]);
      }
    }
  });

  dbOnly.sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt));
  dbOnly.forEach(t => {
    console.log(`${t.type} $${t.amt.toFixed(2).padStart(10)} | ${t.transaction_date} | ${t.transaction_item}`);
  });

  console.log('\n\n=========================================');
  console.log('  總結');
  console.log('=========================================');
  console.log(`銀行有但數據庫沒有: ${bankOnly.length} 筆`);
  console.log(`數據庫有但銀行沒有: ${dbOnly.length} 筆`);
}

main();
