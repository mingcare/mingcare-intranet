// Verify the opening balance calculation logic
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

const LEDGER_OPENING_BALANCE = 82755.59;
const CHEQUE_ACCOUNT_OPENING_BALANCE = 1086.54;
const DISPLAY_START_DATE = '2025-04-01';

async function verify() {
  console.log('='.repeat(80));
  console.log('Verifying Opening Balance Calculation');
  console.log('='.repeat(80));
  
  // Fetch all transactions from 2025-04
  let allData = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('transaction_date', DISPLAY_START_DATE)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('transaction_date', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.log('Error:', error);
      return;
    }

    if (data) {
      allData = [...allData, ...data];
    }

    if (!data || data.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  console.log(`Total transactions fetched: ${allData.length}`);

  // Calculate Savings Account monthly balances
  const savingsMonthly = {};
  let savingsRunning = LEDGER_OPENING_BALANCE;

  // Calculate Current Account monthly balances
  const currentMonthly = {};
  let currentRunning = CHEQUE_ACCOUNT_OPENING_BALANCE;

  // Group by month
  const monthlyTxns = {};
  allData.forEach(t => {
    const txnMonth = t.transaction_date.substring(0, 7);
    if (!monthlyTxns[txnMonth]) monthlyTxns[txnMonth] = [];
    monthlyTxns[txnMonth].push(t);
  });

  const sortedMonths = Object.keys(monthlyTxns).sort();
  
  console.log('\n=== SAVINGS ACCOUNT (儲蓄戶口) ===');
  console.log('Month      | Opening      | Income       | Expense      | Closing');
  console.log('-'.repeat(75));

  for (const month of sortedMonths) {
    const txns = monthlyTxns[month];
    
    // Savings filter (same as Intranet)
    const savingsTxns = txns.filter(t => {
      const paymentMethod = (t.payment_method || '').trim();
      if (paymentMethod === '支票') {
        return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
      }
      return paymentMethod === '銀行轉賬';
    });
    
    const opening = savingsRunning;
    let income = 0, expense = 0;
    
    savingsTxns.forEach(t => {
      income += (t.income_amount || 0);
      expense += (t.expense_amount || 0);
      savingsRunning += (t.income_amount || 0) - (t.expense_amount || 0);
    });
    
    savingsMonthly[month] = savingsRunning;
    
    console.log(`${month}    | ${opening.toFixed(2).padStart(12)} | ${income.toFixed(2).padStart(12)} | ${expense.toFixed(2).padStart(12)} | ${savingsRunning.toFixed(2).padStart(12)}`);
  }

  console.log('\n=== CURRENT ACCOUNT (支票戶口) ===');
  console.log('Month      | Opening      | Income       | Expense      | Closing');
  console.log('-'.repeat(75));

  // Reset for Current Account
  currentRunning = CHEQUE_ACCOUNT_OPENING_BALANCE;
  
  for (const month of sortedMonths) {
    const txns = monthlyTxns[month];
    
    // Current Account filter (same as Intranet)
    const currentTxns = txns.filter(t => {
      const paymentMethod = (t.payment_method || '').trim();
      if (paymentMethod === '支票' || paymentMethod === '支票戶口轉帳') {
        return (t.expense_amount || 0) > 0 || (t.income_amount > 0 && t.income_category === '內部轉帳');
      }
      return false;
    });
    
    const opening = currentRunning;
    let income = 0, expense = 0;
    
    currentTxns.forEach(t => {
      income += (t.income_amount || 0);
      expense += (t.expense_amount || 0);
      currentRunning += (t.income_amount || 0) - (t.expense_amount || 0);
    });
    
    currentMonthly[month] = currentRunning;
    
    console.log(`${month}    | ${opening.toFixed(2).padStart(12)} | ${income.toFixed(2).padStart(12)} | ${expense.toFixed(2).padStart(12)} | ${currentRunning.toFixed(2).padStart(12)}`);
  }

  console.log('\n=== OPENING BALANCE FOR 2026-01 ===');
  console.log(`Savings Account (儲蓄戶口):`);
  console.log(`  December 2025 closing: $${savingsMonthly['2025-12']?.toFixed(2) || 'N/A'}`);
  console.log(`  This should be the opening balance for January 2026`);
  
  console.log(`\nCurrent Account (支票戶口):`);
  console.log(`  December 2025 closing: $${currentMonthly['2025-12']?.toFixed(2) || 'N/A'}`);
  console.log(`  This should be the opening balance for January 2026`);
  
  console.log('\n=== EXPECTED BANK STATEMENT VALUES ===');
  console.log('Savings (Bank): Opening $161,604.07 for Jan 2026');
  console.log('Current (Bank): Opening $1,757.04 for Jan 2026');
}

verify();
