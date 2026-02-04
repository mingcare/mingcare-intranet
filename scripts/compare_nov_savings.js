const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Parse bank statement
const pdfPath = '/Users/joecheung/Documents/GitHub/mingcare-intranet/bank statement/002113176/002113176_5304482_USD_112025.pdf';
const rawText = execSync(`pdftotext -raw "${pdfPath}" -`).toString();

// Extract HKD transactions
const lines = rawText.split('\n');
let inHKD = false;
const bankTxns = [];
let currentDate = '';
let currentAmount = 0;
let isDeposit = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.includes('Currency: HKD')) inHKD = true;
  if (line.includes('Currency: USD')) inHKD = false;
  
  if (!inHKD) continue;
  
  // Match date lines with amounts
  const dateMatch = line.match(/^(\d{2}-Nov-25)\s+([\d,]+\.\d{2})\s+(FPS|DR|CR|利息)/);
  if (dateMatch) {
    const date = dateMatch[1];
    const amount = parseFloat(dateMatch[2].replace(/,/g, ''));
    const type = dateMatch[3];
    
    // Check if next line or context indicates deposit/withdrawal
    const isWithdrawal = line.includes('EBGPP') || line.includes('EBICT51') && !line.includes('CR ');
    const isDeposit = line.includes('NOTPROVIDED') || line.includes('利息') || line.startsWith(date + ' ' + dateMatch[2] + ' FPS ') && !line.includes('EBGPP');
    
    if (type === '利息') {
      bankTxns.push({ date, amount, type: 'deposit', desc: 'Interest' });
    } else if (line.includes('EBGPP') || line.includes('FPS FEE')) {
      bankTxns.push({ date, amount, type: 'withdrawal', desc: line.substring(line.indexOf('FPS')) });
    } else if (line.includes('EBICT') && line.includes('DR ')) {
      bankTxns.push({ date, amount, type: 'withdrawal', desc: 'Internal Transfer OUT' });
    } else if (line.includes('CR ') && line.includes('EBICT')) {
      bankTxns.push({ date, amount, type: 'deposit', desc: 'Internal Transfer IN' });
    } else {
      bankTxns.push({ date, amount, type: 'deposit', desc: line.substring(20, 60) });
    }
  }
}

(async () => {
  console.log('=== November Savings Comparison ===\n');
  
  // Get Intranet transactions
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30')
    .neq('deduct_from_petty_cash', true);
  
  // Sum by type
  const intranetIncome = txns.filter(t => t.income_amount > 0);
  const intranetExpense = txns.filter(t => t.expense_amount > 0);
  
  console.log('Intranet Income Records:', intranetIncome.length);
  console.log('Intranet Expense Records:', intranetExpense.length);
  
  // List large income items to compare
  console.log('\n=== Large Income Items (>$10,000) ===');
  intranetIncome.filter(t => t.income_amount >= 10000).sort((a,b) => b.income_amount - a.income_amount).forEach(t => {
    console.log(`  ${t.transaction_date} | $${t.income_amount.toString().padStart(8)} | ${t.journal_number} | ${t.transaction_item?.substring(0,30)}`);
  });
  
  // Check for FPS fees in intranet
  const fpsFees = txns.filter(t => t.transaction_item?.includes('FPS') || t.expense_category === '銀行手續費');
  console.log('\n=== FPS Fees in Intranet ===');
  fpsFees.forEach(t => {
    console.log(`  ${t.transaction_date} | $${t.expense_amount} | ${t.journal_number} | ${t.transaction_item}`);
  });
  
  // Bank statement shows these FPS fees:
  // 03-Nov: $5 (黃華瓊)
  // 06-Nov: $5 x 6 = $30 (各工資轉帳)
  // 07-Nov: $5 x 2 = $10 (Steven)
  // 13-Nov: $5 (MPF)
  // 17-Nov: $5 (Kanas)
  // 18-Nov: $5 x 2 = $10 (Candy, Mr Fu)
  // 20-Nov: $5 (IT transfer) - not charged?
  // 21-Nov: $5 (客人退款)
  // 24-Nov: $5 (賴佩玲)
  // 28-Nov: $5 x 4 = $20 (Kyocera, Petty, 租金, Joe)
  
  // Check if IT-NOV-004/005 should be reversed
  console.log('\n=== Internal Transfer Records ===');
  txns.filter(t => t.journal_number?.startsWith('IT-NOV')).forEach(t => {
    console.log(`  ${t.journal_number} | Inc: $${t.income_amount || 0} | Exp: $${t.expense_amount || 0} | ${t.transaction_item?.substring(0,40)}`);
  });
  
  // Calculate differences
  const intranetTotalInc = intranetIncome.reduce((s,t) => s + t.income_amount, 0);
  const intranetTotalExp = intranetExpense.reduce((s,t) => s + t.expense_amount, 0);
  
  console.log('\n=== Totals ===');
  console.log('Intranet Income:', intranetTotalInc.toFixed(2));
  console.log('Bank Income:    ', 385700.29);
  console.log('Diff:           ', (intranetTotalInc - 385700.29).toFixed(2), '(positive = Intranet has more)');
  
  console.log('\nIntranet Expense:', intranetTotalExp.toFixed(2));
  console.log('Bank Expense:    ', 413974.21);
  console.log('Diff:            ', (intranetTotalExp - 413974.21).toFixed(2), '(negative = Bank has more)');
  
  // The income diff is +13870, meaning Intranet has 13870 more income than bank
  // The expense diff is -7915, meaning Bank has 7915 more expense than Intranet
  // Net closing diff = -13870 - 7915 = -21785 ✓
  
  console.log('\n=== Missing FPS Fees Analysis ===');
  // Bank FPS fees total:
  // Looking at the statement, count DR transactions that are FPS fees
  // Each FPS outgoing transfer has a $5 fee
  const bankFees = [
    '03-Nov $5 黃華瓊',
    '06-Nov $5 Service U',
    '06-Nov $5 各工資1',
    '06-Nov $5 各工資2', 
    '06-Nov $5 各工資3',
    '06-Nov $5 各工資4',
    '06-Nov $5 各工資5',
    '06-Nov $5 IT-001',
    '06-Nov $5 IT-002',
    '07-Nov $5 Steven1',
    '07-Nov $5 Steven2',
    '13-Nov $5 MPF',
    '17-Nov $5 Kanas',
    '18-Nov $5 Petty',
    '18-Nov $5 Mr Fu',
    '21-Nov $5 客人退款',
    '24-Nov $5 賴佩玲',
    '28-Nov $5 Kyocera',
    '28-Nov $5 Petty',
    '28-Nov $5 租金',
    '28-Nov $5 Joe'
  ];
  console.log('Estimated FPS fees from bank statement:', bankFees.length * 5);
})();
