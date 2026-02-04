const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement - June 2025 Cheque Account
const bankStatement = [
  { date: '2025-06-02', type: 'expense', amount: 3080.00, cheque: '72', desc: 'Cheque Withdrawal' },
  { date: '2025-06-06', type: 'income', amount: 21500.00, cheque: null, desc: 'CR EBICT50606108407' },
  { date: '2025-06-11', type: 'income', amount: 1000.00, cheque: null, desc: 'CR EBICT50611116615' },
  { date: '2025-06-12', type: 'expense', amount: 488.50, cheque: '30', desc: 'Cheque Withdrawal' },
  { date: '2025-06-12', type: 'expense', amount: 400.00, cheque: '31', desc: 'Cheque Withdrawal' },
  { date: '2025-06-14', type: 'expense', amount: 2040.00, cheque: '27', desc: 'Cheque Withdrawal' },
  { date: '2025-06-16', type: 'expense', amount: 9465.00, cheque: '29', desc: 'Cheque Withdrawal' },
  { date: '2025-06-18', type: 'expense', amount: 5160.00, cheque: '75', desc: 'Cheque Withdrawal' },
  { date: '2025-06-27', type: 'expense', amount: 100.00, cheque: null, desc: 'Charges - Cheque Book Issuance' },
  { date: '2025-06-27', type: 'income', amount: 50000.00, cheque: null, desc: 'CR EBICT50627147485' },
  { date: '2025-06-27', type: 'expense', amount: 50000.00, cheque: '32', desc: 'Cheque Withdrawal' },
];

(async () => {
  // Get June 2025 cheque account transactions from database
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true });

  if (error) {
    console.error('Database error:', error);
    return;
  }

  console.log('=== June 2025 Cheque Account Comparison ===\n');
  console.log('Opening Balance (Bank Statement): $3,420.54');
  console.log('Closing Balance (Bank Statement): $5,187.04\n');

  console.log('--- Database Transactions ---');
  console.log('Found:', data.length, 'transactions\n');

  let dbTotalIn = 0, dbTotalOut = 0;
  
  data.forEach(t => {
    const isIncome = t.type === 'income';
    const amt = parseFloat(t.amount);
    if (isIncome) dbTotalIn += amt; else dbTotalOut += amt;
    
    console.log(`${t.transaction_date} | ${t.journal_number} | ${isIncome ? '+' : '-'}${amt.toFixed(2).padStart(10)} | CHQ:${(t.cheque_number || '-').toString().padStart(3)} | ${(t.description || '').substring(0, 45)}`);
  });

  console.log('\n--- Database Summary ---');
  console.log('Total Income:  +' + dbTotalIn.toFixed(2));
  console.log('Total Expense: -' + dbTotalOut.toFixed(2));
  console.log('Net Change:    ' + (dbTotalIn - dbTotalOut).toFixed(2));
  console.log('Calculated Closing: ' + (3420.54 + dbTotalIn - dbTotalOut).toFixed(2));

  // Bank statement totals
  const bankIn = bankStatement.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const bankOut = bankStatement.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  console.log('\n--- Bank Statement Summary ---');
  console.log('Total Deposits:    +' + bankIn.toFixed(2));
  console.log('Total Withdrawals: -' + bankOut.toFixed(2));
  console.log('Net Change:        ' + (bankIn - bankOut).toFixed(2));
  console.log('Expected Closing:  $5,187.04');

  // Compare
  console.log('\n=== COMPARISON ===');
  console.log('Income Diff:  ' + (dbTotalIn - bankIn).toFixed(2));
  console.log('Expense Diff: ' + (dbTotalOut - bankOut).toFixed(2));

  // Find missing/extra transactions
  console.log('\n--- Bank Statement Transactions ---');
  bankStatement.forEach(b => {
    const sign = b.type === 'income' ? '+' : '-';
    console.log(`${b.date} | ${sign}${b.amount.toFixed(2).padStart(10)} | CHQ:${(b.cheque || '-').toString().padStart(3)} | ${b.desc}`);
  });

  // Match by cheque number
  console.log('\n--- Cheque Number Matching ---');
  const bankCheques = bankStatement.filter(b => b.cheque).map(b => ({ cheque: b.cheque, amount: b.amount, date: b.date }));
  const dbCheques = data.filter(d => d.cheque_number).map(d => ({ cheque: d.cheque_number, amount: parseFloat(d.amount), date: d.transaction_date, journal: d.journal_number }));
  
  bankCheques.forEach(bc => {
    const match = dbCheques.find(dc => dc.cheque === bc.cheque || dc.cheque === parseInt(bc.cheque));
    if (match) {
      const amtMatch = match.amount === bc.amount ? '✓' : `✗ (DB: ${match.amount})`;
      const dateMatch = match.date === bc.date ? '✓' : `✗ (DB: ${match.date})`;
      console.log(`Cheque #${bc.cheque}: Amount ${amtMatch}, Date ${dateMatch} | Bank: ${bc.date} $${bc.amount}`);
    } else {
      console.log(`Cheque #${bc.cheque}: ❌ NOT FOUND in database | Bank: ${bc.date} $${bc.amount}`);
    }
  });

  // Find DB cheques not in bank
  dbCheques.forEach(dc => {
    const match = bankCheques.find(bc => bc.cheque === dc.cheque.toString() || parseInt(bc.cheque) === dc.cheque);
    if (!match) {
      console.log(`DB Cheque #${dc.cheque} (${dc.journal}): ❌ NOT in bank statement | DB: ${dc.date} $${dc.amount}`);
    }
  });
})();
