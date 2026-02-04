const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank statement transactions (HKD only, April 2025)
const bankStatement = [
  // Date, Description, Withdrawal, Deposit
  { date: '2025-04-02', desc: 'AIA AUTOPAY', withdrawal: 1500, deposit: 0 },
  { date: '2025-04-02', desc: 'FPS LAM SIU FONG', withdrawal: 0, deposit: 7500 },
  { date: '2025-04-03', desc: 'FPS Payment (salary etc)', withdrawal: 1650, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Ho Ka Fung Candy', withdrawal: 14250, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Leung Hui Fung', withdrawal: 1500, deposit: 0 },
  { date: '2025-04-03', desc: 'REV FPS Deposit', withdrawal: 0, deposit: 1650 },
  { date: '2025-04-03', desc: 'FPS Tang Kwok Hung', withdrawal: 300, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Chick Ka Wai', withdrawal: 700, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Suen Ming Kuen', withdrawal: 6010, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS FEE x6', withdrawal: 30, deposit: 0 }, // 5*6
  { date: '2025-04-03', desc: 'FPS Kuang Qian Wen', withdrawal: 1250, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Cheng Sau Chun', withdrawal: 1200, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Wang Li Hong', withdrawal: 1490, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Yu Chui Ying Ken', withdrawal: 5800, deposit: 0 },
  { date: '2025-04-03', desc: 'REV FPS x4', withdrawal: 17000, deposit: 0 }, // 2200+4200+450+4670+3430+7120 = grouped
  { date: '2025-04-03', desc: 'DR EBICT (internal transfer)', withdrawal: 13470, deposit: 0 },
  { date: '2025-04-03', desc: 'REV FPS Deposits x4', withdrawal: 0, deposit: 18640 }, // 4200+2200+4670+450+7120
  { date: '2025-04-03', desc: 'FPS Lau Suet Nagi', withdrawal: 3430, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Yu Yung Hsu', withdrawal: 1650, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Yu Tsui King', withdrawal: 4200, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Wang Dong Ming', withdrawal: 450, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Pu Chunrong', withdrawal: 7120, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS Chu Tung Ping', withdrawal: 4670, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS FEE x6', withdrawal: 30, deposit: 0 },
  { date: '2025-04-03', desc: 'REV FPS + Deposit', withdrawal: 2200, deposit: 2200 },
  { date: '2025-04-03', desc: 'FPS Chuk Fung Sin', withdrawal: 2200, deposit: 0 },
  { date: '2025-04-03', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-03', desc: 'CHEQUE DEPOSIT 701210', withdrawal: 0, deposit: 1040 },
  { date: '2025-04-05', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 600 },
  { date: '2025-04-06', desc: 'FPS HO TAK CHUI', withdrawal: 0, deposit: 1800 },
  { date: '2025-04-07', desc: 'CR (return)', withdrawal: 0, deposit: 3430 },
  { date: '2025-04-07', desc: 'FPS YAU YUET WA', withdrawal: 0, deposit: 1560 },
  { date: '2025-04-08', desc: 'AIA AUTOPAY', withdrawal: 4000, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS YAU KIN NAM', withdrawal: 0, deposit: 50000 },
  { date: '2025-04-08', desc: 'FPS Yeung Yee On (salary)', withdrawal: 4160, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS Ho Ka Fung Candy', withdrawal: 2800, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS Ho Ka Fung Candy', withdrawal: 3000, deposit: 0 },
  { date: '2025-04-08', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-12', desc: 'FPS HO TAK CHUI', withdrawal: 0, deposit: 1800 },
  { date: '2025-04-13', desc: 'FPS WONG HAU YEE', withdrawal: 0, deposit: 300 },
  { date: '2025-04-13', desc: 'FPS CHAN MEI WING', withdrawal: 0, deposit: 1800 },
  { date: '2025-04-13', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 330 },
  { date: '2025-04-13', desc: 'FPS WONG HAU YEE', withdrawal: 0, deposit: 300 },
  { date: '2025-04-13', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 1200 },
  { date: '2025-04-14', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 330 },
  { date: '2025-04-14', desc: 'FPS CHAN YIU MAN', withdrawal: 0, deposit: 300 },
  { date: '2025-04-14', desc: 'FPS CHAN KA YAN', withdrawal: 0, deposit: 300 },
  { date: '2025-04-15', desc: 'FPS Leung Pui Man (salary)', withdrawal: 19000, deposit: 0 },
  { date: '2025-04-15', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-15', desc: 'FPS KWAN MAN KEE', withdrawal: 0, deposit: 250 },
  { date: '2025-04-16', desc: 'FPS CHAN WING YAN', withdrawal: 0, deposit: 720 },
  { date: '2025-04-16', desc: 'FPS NG PUI LIN', withdrawal: 0, deposit: 300 },
  { date: '2025-04-17', desc: 'FPS YAU YUET WA', withdrawal: 0, deposit: 1040 },
  { date: '2025-04-18', desc: 'FPS HO TAK CHUI', withdrawal: 0, deposit: 1200 },
  { date: '2025-04-19', desc: 'FPS WONG MAN YEE', withdrawal: 0, deposit: 300 },
  { date: '2025-04-19', desc: 'FPS CHAN MEI WING', withdrawal: 0, deposit: 400 },
  { date: '2025-04-19', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 600 },
  { date: '2025-04-20', desc: 'FPS KWOK KAM TIM', withdrawal: 0, deposit: 5525 },
  { date: '2025-04-22', desc: 'FPS WONG MAN YEE', withdrawal: 0, deposit: 50 },
  { date: '2025-04-23', desc: 'FPS Leung Pui Man', withdrawal: 0, deposit: 900 },
  { date: '2025-04-24', desc: 'AIA AUTOPAY', withdrawal: 75, deposit: 0 },
  { date: '2025-04-24', desc: 'FPS LUI YUEN WAN', withdrawal: 0, deposit: 900 },
  { date: '2025-04-25', desc: 'FPS HO TAK CHUI', withdrawal: 0, deposit: 1800 },
  { date: '2025-04-26', desc: 'FPS Cheung Kwun Ho (salary)', withdrawal: 19000, deposit: 0 },
  { date: '2025-04-26', desc: 'FPS FEE', withdrawal: 5, deposit: 0 },
  { date: '2025-04-26', desc: 'FPS LAM SIU FONG', withdrawal: 0, deposit: 9000 },
  { date: '2025-04-27', desc: 'FPS LEE YUK CHUN', withdrawal: 0, deposit: 600 },
  { date: '2025-04-28', desc: 'FPS YAN KA WING', withdrawal: 0, deposit: 300 },
  { date: '2025-04-28', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 560 },
  { date: '2025-04-28', desc: 'FPS YIP CHU LEUNG', withdrawal: 0, deposit: 330 },
  { date: '2025-04-28', desc: 'FPS SLASHER BUILDER', withdrawal: 0, deposit: 10000 },
  { date: '2025-04-29', desc: 'FPS LEUNG PUI MAN', withdrawal: 0, deposit: 750 },
  { date: '2025-04-30', desc: 'FPS YAU KIN NAM', withdrawal: 0, deposit: 50000 },
  { date: '2025-04-30', desc: 'FPS Kyocera (expense)', withdrawal: 638.24, deposit: 0 },
  { date: '2025-04-30', desc: 'FPS Ruby Investment (rent)', withdrawal: 11800, deposit: 0 },
  { date: '2025-04-30', desc: 'FPS FEE x2', withdrawal: 10, deposit: 0 },
  { date: '2025-04-30', desc: 'FPS SLASHER BUILDER', withdrawal: 0, deposit: 1858 },
  { date: '2025-04-30', desc: 'INTEREST', withdrawal: 0, deposit: 5.61 },
];

// Calculate bank statement totals
const bankTotalWithdrawal = bankStatement.reduce((sum, t) => sum + t.withdrawal, 0);
const bankTotalDeposit = bankStatement.reduce((sum, t) => sum + t.deposit, 0);
console.log('=== Bank Statement Summary ===');
console.log('Opening Balance: $82,755.59');
console.log('Total Withdrawals:', bankTotalWithdrawal.toFixed(2));
console.log('Total Deposits:', bankTotalDeposit.toFixed(2));
console.log('Expected Closing:', (82755.59 - bankTotalWithdrawal + bankTotalDeposit).toFixed(2));
console.log('Actual Closing: $103,530.96\n');

async function checkDatabase() {
  // Get all April 2025 transactions with 銀行轉賬 payment method
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('payment_method', '銀行轉賬')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== Database Summary (銀行轉賬 only) ===');
  console.log('Total records:', data.length);
  
  let totalIncome = 0;
  let totalExpense = 0;
  
  data.forEach(t => {
    totalIncome += t.income_amount || 0;
    totalExpense += t.expense_amount || 0;
  });
  
  console.log('Total Income:', totalIncome.toFixed(2));
  console.log('Total Expense:', totalExpense.toFixed(2));
  console.log('Net Change:', (totalIncome - totalExpense).toFixed(2));
  
  const openingBalance = 82755.59;
  const closingBalance = openingBalance + totalIncome - totalExpense;
  console.log('\nOpening Balance: $82,755.59');
  console.log('Calculated Closing Balance:', closingBalance.toFixed(2));
  console.log('Bank Statement Closing: $103,530.96');
  console.log('Difference:', (closingBalance - 103530.96).toFixed(2));

  // Detailed list
  console.log('\n=== Detailed Database Transactions ===');
  console.log('Date\t\t\tJournal#\t\tIncome\t\tExpense\t\tDescription');
  console.log('-'.repeat(100));
  
  data.forEach(t => {
    const date = t.transaction_date;
    const journal = t.journal_number || '-';
    const income = t.income_amount || 0;
    const expense = t.expense_amount || 0;
    const desc = (t.client_name || t.description || t.income_category || t.expense_category || '').substring(0, 30);
    console.log(`${date}\t${journal}\t\t${income || '-'}\t\t${expense || '-'}\t\t${desc}`);
  });

  // Check for potential duplicates or issues
  console.log('\n=== Checking for Potential Issues ===');
  
  // Check AIA payments
  const aiaPayments = data.filter(t => 
    (t.description || '').toLowerCase().includes('aia') || 
    (t.client_name || '').toLowerCase().includes('aia')
  );
  console.log('\nAIA payments found:', aiaPayments.length);
  aiaPayments.forEach(t => {
    console.log(`  ${t.transaction_date} | ${t.journal_number} | Income: ${t.income_amount || 0} | Expense: ${t.expense_amount || 0}`);
  });

  // Check bank fees
  const fees = data.filter(t => 
    (t.expense_category || '').includes('手續費') || 
    (t.description || '').includes('手續費') ||
    (t.description || '').toLowerCase().includes('fee')
  );
  console.log('\nBank fees found:', fees.length);
  let totalFees = 0;
  fees.forEach(t => {
    totalFees += t.expense_amount || 0;
    console.log(`  ${t.transaction_date} | ${t.journal_number} | $${t.expense_amount}`);
  });
  console.log('Total fees in DB:', totalFees);
  
  // Bank statement fees calculation
  // Count FPS fees from statement: multiple $5 fees
  const bankFees = 5 * 6 + 5 * 6 + 5 + 5 + 5 + 5 + 5 + 5 + 5 + 5 + 10; // = 100
  console.log('Expected fees from statement: ~$100');
}

checkDatabase();
