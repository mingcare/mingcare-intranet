const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement - June 2025 Savings Account (儲蓄戶口)
// Opening: $41,078.53 → Closing: $70,815.21
const bankStatement = [
  // Income (Deposits)
  { date: '2025-06-02', type: 'income', amount: 300.00, desc: 'FPS WONG MAN YEE (value date 31-May)' },
  { date: '2025-06-02', type: 'income', amount: 300.00, desc: 'FPS LEUNG Pui Man Kanas (value date 31-May)' },
  { date: '2025-06-03', type: 'income', amount: 330.00, desc: 'FPS DU MIN' },
  { date: '2025-06-04', type: 'income', amount: 50000.00, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-06-05', type: 'income', amount: 50000.00, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-06-09', type: 'income', amount: 3900.00, desc: 'FPS LAW SUET FAN' },
  { date: '2025-06-11', type: 'income', amount: 390.00, desc: 'FPS CHOI IOI MAN' },
  { date: '2025-06-12', type: 'income', amount: 780.00, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-06-14', type: 'income', amount: 1400.00, desc: 'FPS MR CHEUNG WANG HIN FREEMAN' },
  { date: '2025-06-16', type: 'income', amount: 1900.00, desc: 'FPS MR CHEN TSU TEH ROBERT' },
  { date: '2025-06-17', type: 'income', amount: 1320.00, desc: 'FPS MISS CHAN MEI WING' },
  { date: '2025-06-18', type: 'income', amount: 3510.00, desc: 'FPS LAW SUET FAN' },
  { date: '2025-06-18', type: 'income', amount: 1890.00, desc: 'FPS MISS HO KA FUNG CANDY' },
  { date: '2025-06-20', type: 'income', amount: 2250.00, desc: 'FPS MR TSANG CHING MAN' },
  { date: '2025-06-20', type: 'income', amount: 3450.00, desc: 'FPS MS YU YUN CHI' },
  { date: '2025-06-23', type: 'income', amount: 50000.00, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-06-24', type: 'income', amount: 300.00, desc: 'FPS LEUNG Pui Man Kanas' },
  { date: '2025-06-25', type: 'income', amount: 1170.00, desc: 'FPS MR YIP CHU LEUNG' },
  { date: '2025-06-25', type: 'income', amount: 2250.00, desc: 'FPS CHOI IOI MAN' },
  { date: '2025-06-25', type: 'income', amount: 3150.00, desc: 'FPS MS YU YUN CHI' },
  { date: '2025-06-26', type: 'income', amount: 50000.00, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-06-26', type: 'income', amount: 450.00, desc: 'FPS MISS HO TAK CHUI' },
  { date: '2025-06-27', type: 'income', amount: 325.00, desc: 'FPS MS WANG YUQIN' },
  { date: '2025-06-28', type: 'income', amount: 50000.00, desc: 'FPS MR YAU KIN NAM' },
  { date: '2025-06-30', type: 'income', amount: 390.00, desc: 'FPS MR LI CHUN MAN KEVIN (value date 29-Jun)' },
  { date: '2025-06-30', type: 'income', amount: 3450.00, desc: 'FPS MISS YU YUN CHI (value date 29-Jun)' },
  { date: '2025-06-30', type: 'income', amount: 5070.00, desc: 'FPS LAW SUET FAN' },
  { date: '2025-06-30', type: 'income', amount: 5000.00, desc: 'FPS LEUNG PUI MAN KANAS' },
  { date: '2025-06-30', type: 'income', amount: 5.24, desc: 'INTEREST' },
  
  // Expense (Withdrawals)
  { date: '2025-06-04', type: 'expense', amount: 5000.00, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-06-04', type: 'expense', amount: 611.04, desc: 'FPS Kyocera Document Solutions' },
  { date: '2025-06-04', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-04', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 1990.00, desc: 'FPS Yeung Chun Kwai' },
  { date: '2025-06-06', type: 'expense', amount: 850.00, desc: 'FPS Xu ZiQiao' },
  { date: '2025-06-06', type: 'expense', amount: 220.00, desc: 'FPS Li Siu Yee' },
  { date: '2025-06-06', type: 'expense', amount: 9300.00, desc: 'FPS Yu Chui Ying Ken' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 21500.00, desc: 'DR Internal Transfer to Current Account' },
  { date: '2025-06-06', type: 'expense', amount: 400.00, desc: 'FPS Lo Lai Ming Irene' },
  { date: '2025-06-06', type: 'expense', amount: 5650.00, desc: 'FPS Suen Ming Kuen' },
  { date: '2025-06-06', type: 'expense', amount: 6000.00, desc: 'FPS Leung Hui Fung' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 440.00, desc: 'FPS Zhang FenHui' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5160.00, desc: 'FPS Chu Tung Ping' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 4730.00, desc: 'FPS Yu Tsui King' },
  { date: '2025-06-06', type: 'expense', amount: 4250.00, desc: 'FPS Yu Yung Hsu' },
  { date: '2025-06-06', type: 'expense', amount: 1100.00, desc: 'FPS Pu Chunrong' },
  { date: '2025-06-06', type: 'expense', amount: 570.00, desc: 'FPS Tse Chung Lim' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 850.00, desc: 'FPS Yu Bin' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 270.00, desc: 'FPS Lui Yuen Wan' },
  { date: '2025-06-06', type: 'expense', amount: 330.00, desc: 'FPS Duan XiaoFang' },
  { date: '2025-06-06', type: 'expense', amount: 570.00, desc: 'FPS Cheng Tsz To' },
  { date: '2025-06-06', type: 'expense', amount: 18400.00, desc: 'FPS Ng Kiu Ching' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-06', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-11', type: 'expense', amount: 30000.00, desc: 'FPS Kwok Wing Yan' },
  { date: '2025-06-11', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-11', type: 'expense', amount: 1000.00, desc: 'DR Internal Transfer to Current Account' },
  { date: '2025-06-12', type: 'expense', amount: 5700.00, desc: 'AUTOPAY MANULIFE MPF' },
  { date: '2025-06-16', type: 'expense', amount: 400.00, desc: 'FPS Lo Tsz Ying Princess' },
  { date: '2025-06-16', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-17', type: 'expense', amount: 5000.00, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-06-17', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-18', type: 'expense', amount: 2000.00, desc: 'FPS Government GDN' },
  { date: '2025-06-18', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-22', type: 'expense', amount: 19000.00, desc: 'FPS Leung Pui Man Kanas' },
  { date: '2025-06-22', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-23', type: 'expense', amount: 5000.00, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-06-23', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-27', type: 'expense', amount: 647.52, desc: 'FPS Kyocera Document Solutions' },
  { date: '2025-06-27', type: 'expense', amount: 11800.00, desc: 'FPS Ruby Investment Ltd (租金)' },
  { date: '2025-06-27', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-27', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-27', type: 'expense', amount: 50000.00, desc: 'DR Internal Transfer to Current Account' },
  { date: '2025-06-30', type: 'expense', amount: 16150.00, desc: 'FPS Ho Ka Fung Candy' },
  { date: '2025-06-30', type: 'expense', amount: 4750.00, desc: 'FPS Leung Pui Man Kanas' },
  { date: '2025-06-30', type: 'expense', amount: 23750.00, desc: 'FPS Cheung Kwun Ho' },
  { date: '2025-06-30', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-30', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
  { date: '2025-06-30', type: 'expense', amount: 5.00, desc: 'FPS FEE' },
];

(async () => {
  console.log('=== June 2025 Savings Account (儲蓄戶口) Reconciliation ===\n');
  console.log('Bank Statement: Opening $41,078.53 → Closing $70,815.21\n');

  // Query database for June 2025 savings account transactions
  // deduct_from_petty_cash = true AND payment_method != '支票'
  const { data: dbData, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');

  if (error) { console.error('Error:', error); return; }

  console.log('--- Database Transactions (Savings) ---');
  console.log('Found:', dbData.length, 'records\n');

  let dbTotalIn = 0, dbTotalOut = 0;
  
  dbData.forEach(t => {
    const inc = parseFloat(t.income_amount) || 0;
    const exp = parseFloat(t.expense_amount) || 0;
    dbTotalIn += inc;
    dbTotalOut += exp;
    const amt = inc > 0 ? `+$${inc.toFixed(2)}` : `-$${exp.toFixed(2)}`;
    console.log(`${t.transaction_date} | ${t.journal_number} | ${amt.padStart(12)} | ${(t.transaction_item || '').substring(0, 40)}`);
  });

  console.log('\n--- Database Summary ---');
  console.log('Total Income:  +$' + dbTotalIn.toFixed(2));
  console.log('Total Expense: -$' + dbTotalOut.toFixed(2));
  console.log('Net Change:     $' + (dbTotalIn - dbTotalOut).toFixed(2));
  console.log('Calculated Closing: $' + (41078.53 + dbTotalIn - dbTotalOut).toFixed(2));

  // Bank statement summary
  const bankIn = bankStatement.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const bankOut = bankStatement.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  console.log('\n--- Bank Statement Summary ---');
  console.log('Total Deposits:    +$' + bankIn.toFixed(2));
  console.log('Total Withdrawals: -$' + bankOut.toFixed(2));
  console.log('Net Change:         $' + (bankIn - bankOut).toFixed(2));
  console.log('Expected Closing:   $70,815.21');

  // Comparison
  console.log('\n=== COMPARISON ===');
  console.log('Income Diff:  $' + (dbTotalIn - bankIn).toFixed(2) + (Math.abs(dbTotalIn - bankIn) < 0.01 ? ' ✓' : ' ❌'));
  console.log('Expense Diff: $' + (dbTotalOut - bankOut).toFixed(2) + (Math.abs(dbTotalOut - bankOut) < 0.01 ? ' ✓' : ' ❌'));

  // Count FPS fees in bank statement
  const fpsFees = bankStatement.filter(t => t.desc.includes('FPS FEE'));
  console.log('\n--- Bank FPS Fees ---');
  console.log('Count:', fpsFees.length, 'x $5 = $' + (fpsFees.length * 5).toFixed(2));

  // Check internal transfers
  const internalTransfers = bankStatement.filter(t => t.desc.includes('Internal Transfer'));
  console.log('\n--- Bank Internal Transfers (to Current Account) ---');
  internalTransfers.forEach(t => {
    console.log(`${t.date} | -$${t.amount.toFixed(2)} | ${t.desc}`);
  });
  const totalInternalTransfer = internalTransfers.reduce((s, t) => s + t.amount, 0);
  console.log('Total: $' + totalInternalTransfer.toFixed(2));

  // Check if internal transfers exist in DB as expense
  console.log('\n--- DB Internal Transfer Expense Records ---');
  const dbInternalOut = dbData.filter(t => 
    t.expense_category === '內部轉帳' || 
    (t.transaction_item && t.transaction_item.includes('內部轉賬'))
  );
  dbInternalOut.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | -$${t.expense_amount} | ${t.transaction_item}`);
  });
})();
