const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement - June 2025 Cheque Account (Current Account)
// Opening: $3,420.54 → Closing: $5,187.04
const bankStatement = [
  { date: '2025-06-02', type: 'expense', amount: 3080.00, cheque: '72', desc: 'Cheque Withdrawal #72' },
  { date: '2025-06-06', type: 'income', amount: 21500.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-11', type: 'income', amount: 1000.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-12', type: 'expense', amount: 488.50, cheque: '30', desc: 'Cheque Withdrawal #30' },
  { date: '2025-06-12', type: 'expense', amount: 400.00, cheque: '31', desc: 'Cheque Withdrawal #31' },
  { date: '2025-06-14', type: 'expense', amount: 2040.00, cheque: '27', desc: 'Cheque Withdrawal #27' },
  { date: '2025-06-16', type: 'expense', amount: 9465.00, cheque: '29', desc: 'Cheque Withdrawal #29' },
  { date: '2025-06-18', type: 'expense', amount: 5160.00, cheque: '75', desc: 'Cheque Withdrawal #75' },
  { date: '2025-06-27', type: 'expense', amount: 100.00, cheque: null, desc: 'Cheque Book Fee' },
  { date: '2025-06-27', type: 'income', amount: 50000.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-27', type: 'expense', amount: 50000.00, cheque: '32', desc: 'Cheque Withdrawal #32' },
];

(async () => {
  console.log('=== June 2025 Cheque Account (往來戶口) Reconciliation ===\n');
  console.log('Bank Statement: Opening $3,420.54 → Closing $5,187.04\n');

  // 1. 查詢支票交易 (payment_method = 支票)
  const { data: chequeData, error: e1 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');

  if (e1) { console.error('Error:', e1); return; }

  console.log('--- Database: 支票交易 (payment_method=支票) ---');
  console.log('Found:', chequeData.length, 'records\n');
  
  let dbChequeTotal = 0;
  chequeData.forEach(t => {
    const isIncome = parseFloat(t.income_amount) > 0;
    const amt = isIncome ? parseFloat(t.income_amount) : parseFloat(t.expense_amount);
    const sign = isIncome ? '+' : '-';
    if (!isIncome) dbChequeTotal += amt;
    console.log(`${t.transaction_date} | ${t.journal_number} | ${sign}$${amt.toFixed(2).padStart(10)} | ${(t.notes || '-').padEnd(12).substring(0,12)} | ${(t.transaction_item || '').substring(0, 30)}`);
  });
  console.log('DB Total Cheque Expense: $' + dbChequeTotal.toFixed(2));

  // 2. 查詢內部轉賬 (income to cheque account)
  const { data: transferData, error: e2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('income_category', '內部轉帳')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date');

  console.log('\n--- Database: 內部轉賬收入 (income_category=內部轉帳) ---');
  console.log('Found:', transferData?.length || 0, 'records\n');
  
  let dbTransferIn = 0;
  if (transferData) {
    transferData.forEach(t => {
      const amt = parseFloat(t.income_amount) || 0;
      dbTransferIn += amt;
      console.log(`${t.transaction_date} | ${t.journal_number} | +$${amt.toFixed(2).padStart(10)} | ${(t.transaction_item || '').substring(0, 40)}`);
    });
  }
  console.log('DB Total Transfer Income: $' + dbTransferIn.toFixed(2));

  // 3. 查詢銀行費用
  const { data: feeData, error: e3 } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('transaction_item.ilike.%支票簿%,transaction_item.ilike.%cheque book%,notes.ilike.%支票簿%')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false);

  console.log('\n--- Database: 支票簿費用 ---');
  if (feeData && feeData.length > 0) {
    feeData.forEach(t => {
      console.log(`${t.transaction_date} | ${t.journal_number} | $${t.expense_amount} | ${t.transaction_item}`);
    });
  } else {
    console.log('Not found in DB');
  }

  // Bank statement summary
  const bankIn = bankStatement.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const bankOut = bankStatement.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  console.log('\n=== Bank Statement Expected ===');
  bankStatement.forEach(b => {
    const sign = b.type === 'income' ? '+' : '-';
    console.log(`${b.date} | ${sign}$${b.amount.toFixed(2).padStart(10)} | ${b.desc}`);
  });

  console.log('\n--- Summary ---');
  console.log('Bank Deposits:    +$' + bankIn.toFixed(2));
  console.log('Bank Withdrawals: -$' + bankOut.toFixed(2));
  console.log('Bank Net Change:   $' + (bankIn - bankOut).toFixed(2));
  console.log('Expected: $3,420.54 + $' + (bankIn - bankOut).toFixed(2) + ' = $5,187.04');

  console.log('\nDB Transfer In:    $' + dbTransferIn.toFixed(2));
  console.log('DB Cheque Out:     $' + dbChequeTotal.toFixed(2));
  console.log('DB Net Change:     $' + (dbTransferIn - dbChequeTotal).toFixed(2));

  // Comparison
  console.log('\n=== COMPARISON ===');
  console.log('Deposit Diff:    $' + (dbTransferIn - bankIn).toFixed(2) + (dbTransferIn === bankIn ? ' ✓' : ' ❌'));
  console.log('Withdrawal Diff: $' + (dbChequeTotal - bankOut).toFixed(2) + (dbChequeTotal === bankOut ? ' ✓' : ' ❌'));

  // Match by notes (cheque number)
  console.log('\n=== Cheque Matching (by notes) ===');
  const bankCheques = bankStatement.filter(b => b.cheque);
  
  for (const bc of bankCheques) {
    const dbMatch = chequeData.find(d => 
      d.notes && (d.notes.includes('#' + bc.cheque) || d.notes.includes('No.' + bc.cheque) || d.notes === bc.cheque)
    );
    if (dbMatch) {
      const amtOk = parseFloat(dbMatch.expense_amount) === bc.amount;
      const dateOk = dbMatch.transaction_date === bc.date;
      if (amtOk && dateOk) {
        console.log(`✓ CHQ#${bc.cheque}: OK ($${bc.amount} on ${bc.date})`);
      } else {
        console.log(`⚠ CHQ#${bc.cheque}: MISMATCH`);
        console.log(`   Bank: $${bc.amount} on ${bc.date}`);
        console.log(`   DB:   $${dbMatch.expense_amount} on ${dbMatch.transaction_date} (${dbMatch.journal_number})`);
      }
    } else {
      console.log(`❌ CHQ#${bc.cheque}: NOT FOUND in DB (Bank: $${bc.amount} on ${bc.date})`);
    }
  }

  // Find DB cheques not in bank
  console.log('\n=== DB Cheques NOT in Bank Statement ===');
  for (const dc of chequeData) {
    const chequeNum = dc.notes ? dc.notes.match(/#?(\d+)/)?.[1] : null;
    if (chequeNum) {
      const inBank = bankCheques.find(bc => bc.cheque === chequeNum);
      if (!inBank) {
        console.log(`⚠ DB ${dc.journal_number}: CHQ#${chequeNum} $${dc.expense_amount} on ${dc.transaction_date} NOT in bank statement`);
      }
    }
  }
})();
