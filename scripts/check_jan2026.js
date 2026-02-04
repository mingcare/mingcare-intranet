// Check January 2026 data - READ ONLY, no modifications
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank statement reference
const BANK_DATA = {
  '2025-04': { opening: 82755.59, income: 182468.61, expense: 161693.24, closing: 103530.96 },
  '2026-01': { opening: 161604.07, income: 776562.18, expense: 400205.17, closing: 537961.08 }
};

const LEDGER_OPENING_BALANCE = 82755.59;

async function checkJan2026() {
  console.log('='.repeat(80));
  console.log('Checking January 2026 Data - READ ONLY');
  console.log('='.repeat(80));
  
  // First, let's understand what the Intranet shows for April 2025
  console.log('\n=== APRIL 2025 CHECK ===');
  const { data: apr2025 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date');
  
  // Apply the SAME filter as Intranet for savings account
  const apr2025Savings = apr2025.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    if (paymentMethod === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return paymentMethod === '銀行轉賬';
  });
  
  const apr2025Income = apr2025Savings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const apr2025Expense = apr2025Savings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  
  console.log(`April 2025 Savings (Intranet filter logic):`);
  console.log(`  Total records: ${apr2025Savings.length}`);
  console.log(`  Income: $${apr2025Income.toFixed(2)}`);
  console.log(`  Expense: $${apr2025Expense.toFixed(2)}`);
  console.log(`  Opening: $${LEDGER_OPENING_BALANCE}`);
  console.log(`  Calculated Closing: $${(LEDGER_OPENING_BALANCE + apr2025Income - apr2025Expense).toFixed(2)}`);
  console.log(`  Bank Closing: $${BANK_DATA['2025-04'].closing}`);
  
  // Now check January 2026
  console.log('\n=== JANUARY 2026 CHECK ===');
  const { data: jan2026 } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .order('transaction_date');
  
  const jan2026Savings = jan2026.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    if (paymentMethod === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return paymentMethod === '銀行轉賬';
  });
  
  const jan2026Income = jan2026Savings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const jan2026Expense = jan2026Savings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  
  console.log(`January 2026 Savings (Intranet filter logic):`);
  console.log(`  Total records: ${jan2026Savings.length}`);
  console.log(`  Income: $${jan2026Income.toFixed(2)}`);
  console.log(`  Expense: $${jan2026Expense.toFixed(2)}`);
  console.log(`  Bank Income: $${BANK_DATA['2026-01'].income}`);
  console.log(`  Bank Expense: $${BANK_DATA['2026-01'].expense}`);
  
  // Now calculate what the opening balance SHOULD be for January 2026
  // This requires calculating all prior months from April 2025 to December 2025
  console.log('\n=== CALCULATING OPENING BALANCE FOR JANUARY 2026 ===');
  
  const { data: allPriorData } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-12-31')
    .order('transaction_date');
  
  // Apply the same filter as Intranet
  const allPriorSavings = allPriorData.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    if (paymentMethod === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return paymentMethod === '銀行轉賬';
  });
  
  const priorIncome = allPriorSavings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const priorExpense = allPriorSavings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const calculatedOpeningForJan = LEDGER_OPENING_BALANCE + priorIncome - priorExpense;
  
  console.log(`Prior months (Apr-Dec 2025) summary:`);
  console.log(`  Total records: ${allPriorSavings.length}`);
  console.log(`  Total Income: $${priorIncome.toFixed(2)}`);
  console.log(`  Total Expense: $${priorExpense.toFixed(2)}`);
  console.log(`  Net Change: $${(priorIncome - priorExpense).toFixed(2)}`);
  console.log(`\n  Base Opening (Apr 2025): $${LEDGER_OPENING_BALANCE}`);
  console.log(`  + Net Change: $${(priorIncome - priorExpense).toFixed(2)}`);
  console.log(`  = Calculated Opening for Jan 2026: $${calculatedOpeningForJan.toFixed(2)}`);
  console.log(`  Expected Opening (Bank): $${BANK_DATA['2026-01'].opening}`);
  console.log(`  DIFFERENCE: $${(calculatedOpeningForJan - BANK_DATA['2026-01'].opening).toFixed(2)}`);
  
  // Let's break down by month to see where the difference comes from
  console.log('\n=== MONTH BY MONTH BREAKDOWN ===');
  
  const months = [
    { month: '2025-04', start: '2025-04-01', end: '2025-04-30' },
    { month: '2025-05', start: '2025-05-01', end: '2025-05-31' },
    { month: '2025-06', start: '2025-06-01', end: '2025-06-30' },
    { month: '2025-07', start: '2025-07-01', end: '2025-07-31' },
    { month: '2025-08', start: '2025-08-01', end: '2025-08-31' },
    { month: '2025-09', start: '2025-09-01', end: '2025-09-30' },
    { month: '2025-10', start: '2025-10-01', end: '2025-10-31' },
    { month: '2025-11', start: '2025-11-01', end: '2025-11-30' },
    { month: '2025-12', start: '2025-12-01', end: '2025-12-31' },
  ];
  
  let runningBalance = LEDGER_OPENING_BALANCE;
  
  for (const m of months) {
    const monthData = allPriorData.filter(t => 
      t.transaction_date >= m.start && t.transaction_date <= m.end
    );
    
    const monthSavings = monthData.filter(t => {
      const paymentMethod = (t.payment_method || '').trim();
      if (paymentMethod === '支票') {
        return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
      }
      return paymentMethod === '銀行轉賬';
    });
    
    const income = monthSavings.reduce((sum, t) => sum + (t.income_amount || 0), 0);
    const expense = monthSavings.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
    const opening = runningBalance;
    const closing = opening + income - expense;
    
    console.log(`\n${m.month}:`);
    console.log(`  Opening: $${opening.toFixed(2)}`);
    console.log(`  Income: $${income.toFixed(2)} | Expense: $${expense.toFixed(2)}`);
    console.log(`  Closing: $${closing.toFixed(2)}`);
    
    runningBalance = closing;
  }
  
  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Calculated Opening for Jan 2026: $${runningBalance.toFixed(2)}`);
  console.log(`Bank Statement Opening for Jan 2026: $${BANK_DATA['2026-01'].opening}`);
  console.log(`Difference: $${(runningBalance - BANK_DATA['2026-01'].opening).toFixed(2)}`);
}

checkJan2026();
