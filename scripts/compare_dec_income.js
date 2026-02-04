const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Income December 2025
const bankIncome = [
  { date: '01-Dec', amount: 600, desc: 'FPS MISS LEUNG WAI YIN' },
  { date: '01-Dec', amount: 17100, desc: 'CHEQUE 000622' },
  { date: '01-Dec', amount: 1320, desc: 'FPS MISS HONG YAN KIU' },
  { date: '01-Dec', amount: 120, desc: 'FPS CHAN WING YAN' },
  { date: '01-Dec', amount: 420, desc: 'FPS LEUNG YU YIU SINDY' },
  { date: '04-Dec', amount: 18400, desc: 'FPS MS AU MAN WAH VICKY' },
  { date: '04-Dec', amount: 420, desc: 'FPS CHUNG YUK MAN RAYMOND' },
  { date: '05-Dec', amount: 250000, desc: 'CHEQUE 520540 Mr Yau' },
  { date: '06-Dec', amount: 1120, desc: 'FPS CHUNG YUK MAN' },
  { date: '08-Dec', amount: 17875, desc: 'FPS BRIGHT LIGHTING WHOLESALE' },
  { date: '08-Dec', amount: 10575, desc: 'Internal Transfer IN (from Current)' },
  { date: '10-Dec', amount: 140, desc: 'FPS CHUNG YUK MAN' },
  { date: '12-Dec', amount: 13000, desc: 'Internal Transfer IN (from Current)' },
  { date: '13-Dec', amount: 2400, desc: 'FPS ASSOCIATION OF DOCTORS' },
  { date: '13-Dec', amount: 392.70, desc: 'FPS ASSOCIATION OF DOCTORS' },
  { date: '13-Dec', amount: 185, desc: 'FPS ASSOCIATION OF DOCTORS' },
  { date: '13-Dec', amount: 700, desc: 'FPS CHUNG YUK MAN' },
  { date: '16-Dec', amount: 490, desc: 'FPS CHUNG YUK MAN' },
  { date: '17-Dec', amount: 480, desc: 'FPS MISS WONG MAN YEE' },
  { date: '19-Dec', amount: 25940, desc: 'FPS SLASHER BUILDER' },
  { date: '19-Dec', amount: 180, desc: 'FPS MISS WONG MAN YEE' },
  { date: '19-Dec', amount: 10000, desc: 'FPS MISS HO WING KIU' },
  { date: '23-Dec', amount: 102395, desc: 'CHEQUE 460166 醫點' },
  { date: '29-Dec', amount: 420, desc: 'FPS CHUNG YUK MAN' },
  { date: '31-Dec', amount: 13620, desc: 'CHEQUE 000628' },
  { date: '31-Dec', amount: 1950, desc: 'FPS MISS HO TAK CHUI' },
  { date: '31-Dec', amount: 9.98, desc: 'INTEREST' },
];

const bankTotal = bankIncome.reduce((s, i) => s + i.amount, 0);
console.log('Bank Income Items:', bankIncome.length);
console.log('Bank Total:', bankTotal.toFixed(2));

(async () => {
  const { data: all } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .gt('income_amount', 0)
    .neq('deduct_from_petty_cash', true)
    .order('transaction_date');
  
  // Savings filter
  const savings = all.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });
  
  console.log('\nIntranet Income Items:', savings.length);
  const intranetTotal = savings.reduce((s, t) => s + parseFloat(t.income_amount), 0);
  console.log('Intranet Total:', intranetTotal.toFixed(2));
  
  console.log('\nDifference:', (bankTotal - intranetTotal).toFixed(2));
  
  // Check what's missing
  console.log('\n=== 比較銀行同 Intranet ===');
  
  // Map Intranet amounts
  const intranetAmounts = {};
  savings.forEach(t => {
    const amt = parseFloat(t.income_amount);
    if (!intranetAmounts[amt]) intranetAmounts[amt] = [];
    intranetAmounts[amt].push(t);
  });
  
  console.log('\n銀行有但 Intranet 可能冇:');
  bankIncome.forEach(b => {
    if (!intranetAmounts[b.amount] || intranetAmounts[b.amount].length === 0) {
      console.log('  ❌', b.date, '$' + b.amount, b.desc);
    } else {
      intranetAmounts[b.amount].pop(); // Remove matched
    }
  });
})();
