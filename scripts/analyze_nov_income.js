const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank statement deposits (manually extracted from PDF):
const bankDeposits = [
  { date: '01-Nov', amount: 1350, desc: 'MR HUNG KWONG LOUIE LUCIAN' },
  { date: '03-Nov', amount: 50000, desc: 'MR YAU KIN NAM' },
  { date: '03-Nov', amount: 225, desc: 'MISS MUI YEUK YIN ROBERTA' },
  { date: '04-Nov', amount: 26957, desc: 'LAI YIN YEE' },
  { date: '04-Nov', amount: 360, desc: 'CHAN WING YAN' },
  { date: '04-Nov', amount: 50000, desc: 'MR YAU KIN NAM' },
  { date: '05-Nov', amount: 50000, desc: 'MR YAU KIN NAM' },
  { date: '05-Nov', amount: 380, desc: 'LEUNG HEI' },
  { date: '06-Nov', amount: 11500, desc: 'MS AU MAN WAH VICKY' },
  { date: '06-Nov', amount: 50000, desc: 'MR YAU KIN NAM' },
  { date: '07-Nov', amount: 10000, desc: 'MR KWOK LAP YAN STEVEN' },
  // Continue from page 4
  { date: '07-Nov', amount: 40800, desc: 'MR KWOK LAP YAN STEVEN' },
  { date: '10-Nov', amount: 14105, desc: 'YU YUK SUM' },
  { date: '10-Nov', amount: 450, desc: 'MISS LEUNG HEI MAN' },
  { date: '10-Nov', amount: 13300, desc: 'LAI YIN YEE' },
  { date: '10-Nov', amount: 1125, desc: 'MISS MUI YEUK YIN ROBERTA' },
  { date: '10-Nov', amount: 1350, desc: 'MISS LEUNG HEI MAN' },
  { date: '14-Nov', amount: 900, desc: 'MR YAU CHUN FUNG' },
  { date: '18-Nov', amount: 450, desc: 'MR YAU CHUN FUNG' },
  { date: '18-Nov', amount: 1000, desc: 'MR LEUNG TAI LUT' },
  { date: '18-Nov', amount: 390, desc: 'TAM CHUNG WAI' },
  { date: '21-Nov', amount: 20000, desc: 'MR NG YU WA (TVP退回)' },
  { date: '23-Nov', amount: 1800, desc: 'MISS CHAN MEI WING' },
  { date: '24-Nov', amount: 1320, desc: 'MISS HONG YAN KIU' },
  { date: '24-Nov', amount: 7920, desc: 'CR EBICT - IT Reverse IN' },
  { date: '25-Nov', amount: 750, desc: 'MISS HO TAK CHUI' },
  { date: '26-Nov', amount: 24063, desc: 'LAI YIN YEE' },
  { date: '28-Nov', amount: 3750, desc: 'CHAN Yin Wai Sophie' },
  { date: '29-Nov', amount: 600, desc: 'MISS LEUNG WAI YIN ENA' },
  { date: '30-Nov', amount: 600, desc: 'MISS LEUNG? (estimate)' },
  { date: '30-Nov', amount: 5.29, desc: 'Interest' }
];

const bankTotalDeposit = 385700.29; // From statement

(async () => {
  console.log('=== Income Analysis ===\n');
  
  const { data: intranet } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30')
    .neq('deduct_from_petty_cash', true)
    .gt('income_amount', 0)
    .order('income_amount', { ascending: false });
  
  const intranetTotal = intranet.reduce((s, t) => s + t.income_amount, 0);
  console.log('Intranet Total Income:', intranetTotal);
  console.log('Bank Total Income:', bankTotalDeposit);
  console.log('Diff:', intranetTotal - bankTotalDeposit, '\n');
  
  // Check for potential duplicates or mismatched records
  console.log('Checking for suspicious records:\n');
  
  // 1. Multiple Mr Yau records
  const yauRecords = intranet.filter(t => t.transaction_item?.includes('Yau') || t.transaction_item?.includes('Mr Yau'));
  console.log('Mr Yau records:');
  yauRecords.forEach(t => console.log(`  ${t.transaction_date} | $${t.income_amount} | ${t.journal_number} | ${t.transaction_item}`));
  console.log('Total:', yauRecords.reduce((s,t) => s + t.income_amount, 0));
  console.log('Bank has: 4 x $50,000 = $200,000\n');
  
  // 2. IT records (reverse transfers)
  const itRecords = intranet.filter(t => t.journal_number?.startsWith('IT-'));
  console.log('IT Records (should match bank):');
  itRecords.forEach(t => console.log(`  ${t.transaction_date} | $${t.income_amount} | ${t.journal_number}`));
  console.log('Bank has: 24-Nov $7,920 CR EBICT (IT reverse)\n');
  
  // 3. Check if there are records that shouldn't be in November
  console.log('All Income Records:');
  intranet.forEach(t => {
    console.log(`  ${t.transaction_date} | $${t.income_amount.toString().padStart(8)} | ${t.journal_number.padEnd(15)} | ${t.transaction_item?.substring(0,35)}`);
  });
})();
