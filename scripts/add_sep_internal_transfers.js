const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// September 2025 Internal Transfers
// 3 x Savings → Current
// 1 x Current → Savings (reverse)

const transfers = [
  // 03-Sep: Savings out $20,000
  {
    journal_number: 'IT-SEP-001',
    transaction_date: '2025-09-03',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    expense_amount: 20000,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT50903269835',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 03-Sep: Current in $20,000
  {
    journal_number: 'IT-SEP-001-IN',
    transaction_date: '2025-09-03',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_amount: 20000,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT50903269835',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 05-Sep: Savings out $1,600
  {
    journal_number: 'IT-SEP-002',
    transaction_date: '2025-09-05',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    expense_amount: 1600,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT50905274998',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 05-Sep: Current in $1,600
  {
    journal_number: 'IT-SEP-002-IN',
    transaction_date: '2025-09-05',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_amount: 1600,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT50905274998',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 08-Sep: Savings out $40,000
  {
    journal_number: 'IT-SEP-003',
    transaction_date: '2025-09-08',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口',
    payment_method: '銀行轉賬',
    expense_amount: 40000,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT50908277159',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 08-Sep: Current in $40,000
  {
    journal_number: 'IT-SEP-003-IN',
    transaction_date: '2025-09-08',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：支票戶口轉入自儲蓄戶口',
    payment_method: '支票',
    income_amount: 40000,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT50908277159',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 11-Sep: REVERSE - Current out $24,430 (to Savings)
  {
    journal_number: 'IT-SEP-004',
    transaction_date: '2025-09-11',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：支票戶口轉出至儲蓄戶口 (反向)',
    payment_method: '支票',
    expense_amount: 24430,
    expense_category: '內部轉帳',
    income_amount: 0,
    notes: 'EBICT50911284111 - 反向轉帳',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  },
  // 11-Sep: REVERSE - Savings in $24,430 (from Current)
  {
    journal_number: 'IT-SEP-004-IN',
    transaction_date: '2025-09-11',
    billing_month: '2025年9月',
    transaction_item: '內部轉賬：儲蓄戶口轉入自支票戶口 (反向)',
    payment_method: '銀行轉賬',
    income_amount: 24430,
    income_category: '內部轉帳',
    expense_amount: 0,
    notes: 'EBICT50911284111 - 反向轉帳',
    fiscal_year: 2025,
    deduct_from_petty_cash: false
  }
];

(async () => {
  console.log('=== Adding September 2025 Internal Transfers ===\n');

  // Check existing
  const journals = transfers.map(t => t.journal_number);
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .in('journal_number', journals);

  if (existing && existing.length > 0) {
    console.log('⚠️ Some records already exist:', existing.map(r => r.journal_number).join(', '));
    console.log('Skipping existing records...');
    
    const existingJournals = existing.map(r => r.journal_number);
    const newTransfers = transfers.filter(t => !existingJournals.includes(t.journal_number));
    
    if (newTransfers.length === 0) {
      console.log('All records already exist. Skipping insert.');
    } else {
      const { data, error } = await supabase.from('financial_transactions')
        .insert(newTransfers)
        .select();
      
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('Added ' + data.length + ' new records');
      }
    }
  } else {
    const { data, error } = await supabase.from('financial_transactions')
      .insert(transfers)
      .select();

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    console.log('✅ Added ' + data.length + ' records:');
    data.forEach(t => {
      const amt = t.income_amount || t.expense_amount;
      const type = t.income_amount > 0 ? 'Income' : 'Expense';
      console.log('  ' + t.transaction_date + ' | ' + t.journal_number + ' | ' + type + ': $' + amt);
    });
  }

  // Verify
  console.log('\n=== Verifying September 2025 ===');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .order('transaction_date');

  // Savings
  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const sIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const sExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const sOpening = 114671.46;
  const sClosing = sOpening + sIncome - sExpense;

  console.log('\n🏦 儲蓄戶口:');
  console.log('  Opening: $' + sOpening);
  console.log('  Income: $' + sIncome.toFixed(2));
  console.log('  Expense: $' + sExpense.toFixed(2));
  console.log('  Intranet Closing: $' + sClosing.toFixed(2));
  console.log('  Bank Closing: $180,669.99');
  console.log('  Difference: $' + (sClosing - 180669.99).toFixed(2));

  // Current
  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && (t.expense_amount || 0) > 0) return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const cIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const cExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const cOpening = 652.04;
  const cClosing = cOpening + cIncome - cExpense;

  console.log('\n📝 支票戶口:');
  console.log('  Opening: $' + cOpening);
  console.log('  Income: $' + cIncome.toFixed(2) + ' (Bank: $61,600)');
  console.log('  Expense: $' + cExpense.toFixed(2) + ' (Bank: $60,760)');
  console.log('  Intranet Closing: $' + cClosing.toFixed(2));
  console.log('  Bank Closing: $1,492.04');
  console.log('  Difference: $' + (cClosing - 1492.04).toFixed(2));

  if (Math.abs(cClosing - 1492.04) < 1) {
    console.log('\n✅ 支票戶口 MATCH!');
  }
})();
