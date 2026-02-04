const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement - June 2025 Cheque Account
const bankStatement = [
  { date: '2025-06-02', type: 'expense', amount: 3080.00, cheque: '72', desc: 'Cheque Withdrawal' },
  { date: '2025-06-06', type: 'income', amount: 21500.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-11', type: 'income', amount: 1000.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-12', type: 'expense', amount: 488.50, cheque: '30', desc: 'Cheque Withdrawal' },
  { date: '2025-06-12', type: 'expense', amount: 400.00, cheque: '31', desc: 'Cheque Withdrawal' },
  { date: '2025-06-14', type: 'expense', amount: 2040.00, cheque: '27', desc: 'Cheque Withdrawal' },
  { date: '2025-06-16', type: 'expense', amount: 9465.00, cheque: '29', desc: 'Cheque Withdrawal' },
  { date: '2025-06-18', type: 'expense', amount: 5160.00, cheque: '75', desc: 'Cheque Withdrawal' },
  { date: '2025-06-27', type: 'expense', amount: 100.00, cheque: null, desc: 'Charges - Cheque Book' },
  { date: '2025-06-27', type: 'income', amount: 50000.00, cheque: null, desc: 'CR Internal Transfer' },
  { date: '2025-06-27', type: 'expense', amount: 50000.00, cheque: '32', desc: 'Cheque Withdrawal' },
];

(async () => {
  console.log('=== June 2025 Cheque Account Reconciliation ===\n');
  console.log('Bank Statement: Opening $3,420.54 → Closing $5,187.04\n');

  // 1. 查詢有支票號碼的交易
  const { data: chequeData, error: e1 } = await supabase
    .from('financial_transactions')
    .select('*')
    .not('cheque_number', 'is', null)
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('transaction_date');

  if (e1) { console.error(e1); return; }

  console.log('--- Database: 支票交易 (有 cheque_number) ---');
  console.log('Found:', chequeData.length, 'records\n');
  
  chequeData.forEach(t => {
    console.log(`${t.transaction_date} | ${t.journal_number} | CHQ#${t.cheque_number.toString().padStart(2)} | $${parseFloat(t.amount).toFixed(2).padStart(10)} | ${(t.description || '').substring(0, 35)}`);
  });

  // 2. 查詢內部轉賬 (category = 'internal_transfer' 入支票戶口)
  const { data: transferData, error: e2 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('category', 'internal_transfer')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('transaction_date');

  console.log('\n--- Database: 內部轉賬 (internal_transfer) ---');
  console.log('Found:', transferData?.length || 0, 'records\n');
  
  if (transferData) {
    transferData.forEach(t => {
      const sign = t.type === 'income' ? '+' : '-';
      console.log(`${t.transaction_date} | ${t.journal_number} | ${sign}$${parseFloat(t.amount).toFixed(2).padStart(10)} | ${(t.description || '').substring(0, 40)}`);
    });
  }

  // 3. 查詢銀行費用
  const { data: feeData, error: e3 } = await supabase
    .from('financial_transactions')
    .select('*')
    .ilike('description', '%cheque book%')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30');

  console.log('\n--- Database: 支票簿費用 ---');
  if (feeData && feeData.length > 0) {
    feeData.forEach(t => {
      console.log(`${t.transaction_date} | ${t.journal_number} | $${t.amount} | ${t.description}`);
    });
  } else {
    console.log('Not found - need to check if exists');
  }

  // Compare with bank statement
  console.log('\n=== Bank Statement Expected ===');
  bankStatement.forEach(b => {
    const sign = b.type === 'income' ? '+' : '-';
    console.log(`${b.date} | ${sign}$${b.amount.toFixed(2).padStart(10)} | CHQ#${(b.cheque || '-').toString().padStart(2)} | ${b.desc}`);
  });

  // Cheque matching
  console.log('\n=== Cheque Matching ===');
  const bankCheques = bankStatement.filter(b => b.cheque);
  
  for (const bc of bankCheques) {
    const dbMatch = chequeData.find(d => d.cheque_number == bc.cheque);
    if (dbMatch) {
      const amtOk = parseFloat(dbMatch.amount) === bc.amount;
      const dateOk = dbMatch.transaction_date === bc.date;
      if (amtOk && dateOk) {
        console.log(`✓ CHQ#${bc.cheque}: OK ($${bc.amount} on ${bc.date})`);
      } else {
        console.log(`⚠ CHQ#${bc.cheque}: MISMATCH`);
        console.log(`   Bank: $${bc.amount} on ${bc.date}`);
        console.log(`   DB:   $${dbMatch.amount} on ${dbMatch.transaction_date} (${dbMatch.journal_number})`);
      }
    } else {
      console.log(`❌ CHQ#${bc.cheque}: NOT FOUND in DB (Bank: $${bc.amount} on ${bc.date})`);
    }
  }

  // Summary
  const bankIn = bankStatement.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const bankOut = bankStatement.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  console.log('\n=== Summary ===');
  console.log('Bank Deposits:    +$' + bankIn.toFixed(2));
  console.log('Bank Withdrawals: -$' + bankOut.toFixed(2));
  console.log('Net Change:        $' + (bankIn - bankOut).toFixed(2));
  console.log('Opening + Net = $' + (3420.54 + bankIn - bankOut).toFixed(2));
})();
