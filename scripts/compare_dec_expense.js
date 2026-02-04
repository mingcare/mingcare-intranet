const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Expense December 2025 (extracted from PDF)
// Note: REV transactions net to zero so we exclude them
const bankExpense = [
  // 01-Dec FPS payments
  { date: '01-Dec', amount: 5000, desc: 'FPS Ho Ka Fung Candy' },
  { date: '01-Dec', amount: 5, desc: 'FPS FEE' },
  // 03-Dec
  { date: '03-Dec', amount: 5000, desc: 'FPS Wong Wah King' },
  { date: '03-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '03-Dec', amount: 10000, desc: 'FPS Cheung Kwun Ho (Joe)' },
  { date: '03-Dec', amount: 5, desc: 'FPS FEE' },
  // 04-Dec - NOTE: 2 REV pairs (5000+5000) net to zero, only Unicorn remains
  { date: '04-Dec', amount: 5000, desc: 'FPS Unicorn Creative' },
  { date: '04-Dec', amount: 5, desc: 'FPS FEE' },
  // REV pairs: 5000 out + 5000 in = 0, 5 fee + 0 = 5 (but REV so net 0)
  // Actually checking bank statement: the REV entries cancel out
  // 08-Dec - massive salary payments
  { date: '08-Dec', amount: 3315, desc: 'FPS Tse Chung Lim 謝仲廉' },
  { date: '08-Dec', amount: 6300, desc: 'FPS CHUNG H Y 鍾可瑩' },
  { date: '08-Dec', amount: 400, desc: 'FPS Lo Lai Ming 盧麗明' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 1200, desc: 'FPS Cheng Tsz To 鄭芷桃' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 68449, desc: 'EBICT Internal Transfer to Current' },
  { date: '08-Dec', amount: 600, desc: 'FPS Choi Lai Wa 蔡麗華' },
  { date: '08-Dec', amount: 3720, desc: 'FPS LAO F M 劉鳳媚' },
  { date: '08-Dec', amount: 1440, desc: 'FPS Ip Kar Wai 葉嘉慧' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 1285, desc: 'FPS Yeung Chun Kwai 楊春桂' },
  { date: '08-Dec', amount: 2420, desc: 'FPS Chan Pui Shan 陳佩珊' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 23850, desc: 'FPS Leung Hui Fung 梁曉峰' },
  { date: '08-Dec', amount: 4682, desc: 'FPS Yang Yu Lan 楊玉蘭' },
  { date: '08-Dec', amount: 5640, desc: 'FPS Leung Chau To 梁秋桃' },
  { date: '08-Dec', amount: 2160, desc: 'FPS CHANG S Y S 張心怡' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 1650, desc: 'FPS Chum Kwong Fung 覃光鳳' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 10120, desc: 'FPS KUNG YAN CHUN 龔仁珍' },
  { date: '08-Dec', amount: 720, desc: 'FPS So Ka Man 蘇嘉敏' },
  { date: '08-Dec', amount: 1440, desc: 'FPS Law Chor Kwan 羅楚君' },
  { date: '08-Dec', amount: 11000, desc: 'FPS YIM Hay Yu Annie 嚴晞如' },
  { date: '08-Dec', amount: 21540, desc: 'FPS Xu ZiQiao 徐子喬' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5725, desc: 'FPS Suen Ming Kuen 孫明娟' },
  { date: '08-Dec', amount: 1400, desc: 'FPS Ling Siu Mui 凌少梅' },
  { date: '08-Dec', amount: 660, desc: 'FPS Wu Chi Fan 胡志帆' },
  { date: '08-Dec', amount: 4950, desc: 'FPS ZHOU Qiaoshun 周巧順' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 625, desc: 'FPS Ho Ka Fung Candy 卓琪' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 6475, desc: 'FPS Li Siu Yee 李笑儀' },
  { date: '08-Dec', amount: 24362, desc: 'FPS Ng Kiu Ching 吳翹政' },
  { date: '08-Dec', amount: 9460, desc: 'FPS Yu Tsui King 余翠琼' },
  { date: '08-Dec', amount: 2280, desc: 'FPS Chu Tung Ping 朱冬萍' },
  { date: '08-Dec', amount: 13005, desc: 'FPS Yu Chui Ying 余翠英' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  // Continue 08-Dec...
  { date: '08-Dec', amount: 360, desc: 'FPS Wang Li Hong 王利紅' },
  { date: '08-Dec', amount: 2390, desc: 'FPS MA XIULAN 馬秀蘭' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 16150, desc: 'FPS Ho Ka Fung Candy 11月工資' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 8925, desc: 'FPS Feng Yan Ying 馮炎英' },
  { date: '08-Dec', amount: 1650, desc: 'FPS Tan Qiong 譚琼' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  { date: '08-Dec', amount: 5, desc: 'FPS FEE' },
  // 10-Dec
  { date: '10-Dec', amount: 7700, desc: 'AUTOPAY MPF' },
  // 16-Dec
  { date: '16-Dec', amount: 5000, desc: 'FPS Ho Ka Fung Candy' },
  { date: '16-Dec', amount: 5, desc: 'FPS FEE' },
  // 18-Dec
  { date: '18-Dec', amount: 1804.20, desc: 'FPS Service U Company' },
  { date: '18-Dec', amount: 5, desc: 'FPS FEE' },
  // 19-Dec
  { date: '19-Dec', amount: 28500, desc: 'FPS Leung Pui Man Kanas' },
  { date: '19-Dec', amount: 5, desc: 'FPS FEE' },
  // 22-Dec
  { date: '22-Dec', amount: 5000, desc: 'FPS Ho Ka Fung Candy' },
  { date: '22-Dec', amount: 5, desc: 'FPS FEE' },
];

const bankTotal = bankExpense.reduce((s, i) => s + i.amount, 0);

(async () => {
  const { data: all } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('expense_amount', 0)
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  // Savings filter
  const savings = all.filter(t => t.payment_method === '銀行轉賬');
  
  const intranetTotal = savings.reduce((s, t) => s + parseFloat(t.expense_amount), 0);
  
  console.log('=== EXPENSE COMPARISON ===');
  console.log('Bank Expense (from PDF):', bankTotal.toFixed(2));
  console.log('Intranet Expense:', intranetTotal.toFixed(2));
  console.log('Bank Statement Total:', 353572.20);
  console.log('Diff (Intranet - Bank):', (intranetTotal - 353572.20).toFixed(2));
  
  console.log('\n=== Intranet Expense 明細 ===');
  savings.forEach(t => {
    console.log(t.transaction_date, t.journal_number?.padEnd(18), ('$'+parseFloat(t.expense_amount).toFixed(2)).padStart(12), t.transaction_item?.substring(0,35));
  });
})();
