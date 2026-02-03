const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// May 2025 Bank Statement Data
const BANK = {
  savings: {
    opening: 103530.96,
    income: 206071.57,
    expense: 268524.00,
    closing: 41078.53
  },
  current: {
    opening: 3040.54,
    income: 21165.00,
    expense: 20785.00,
    closing: 3420.54
  }
};

// Intranet filter logic
function filterSavings(t) {
  const pm = (t.payment_method || '').trim();
  const isCash = pm === '現金';
  const isLedger = (pm === '銀行轉賬' || pm === '支票' || !pm || (isCash && t.deduct_from_petty_cash === false));
  if (!isLedger) return false;
  if (pm === '支票') {
    return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
  }
  return pm === '銀行轉賬';
}

function filterCurrent(t) {
  const pm = (t.payment_method || '').trim();
  const isCash = pm === '現金';
  const isLedger = (pm === '銀行轉賬' || pm === '支票' || !pm || (isCash && t.deduct_from_petty_cash === false));
  if (!isLedger) return false;
  if (pm === '支票') {
    return (t.expense_amount || 0) > 0 || (t.income_amount > 0 && t.income_category === '內部轉帳');
  }
  return false;
}

async function reconcile() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              MAY 2025 RECONCILIATION                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  // === SAVINGS ===
  const savings = txns.filter(filterSavings);
  let sInc = 0, sExp = 0;
  savings.forEach(t => {
    sInc += parseFloat(t.income_amount || 0);
    sExp += parseFloat(t.expense_amount || 0);
  });
  const sClose = BANK.savings.opening + sInc - sExp;
  
  console.log('=== SAVINGS ACCOUNT (儲蓄戶口) ===');
  console.log('                    Bank Statement    Intranet       Diff');
  console.log('Opening:            $' + BANK.savings.opening.toFixed(2).padStart(10) + '    $' + BANK.savings.opening.toFixed(2).padStart(10));
  console.log('Income:             $' + BANK.savings.income.toFixed(2).padStart(10) + '    $' + sInc.toFixed(2).padStart(10) + '    $' + (BANK.savings.income - sInc).toFixed(2).padStart(8));
  console.log('Expense:            $' + BANK.savings.expense.toFixed(2).padStart(10) + '    $' + sExp.toFixed(2).padStart(10) + '    $' + (BANK.savings.expense - sExp).toFixed(2).padStart(8));
  console.log('Closing:            $' + BANK.savings.closing.toFixed(2).padStart(10) + '    $' + sClose.toFixed(2).padStart(10) + '    $' + (BANK.savings.closing - sClose).toFixed(2).padStart(8) + (Math.abs(BANK.savings.closing - sClose) < 1 ? ' ✅' : ' ❌'));
  
  // === CURRENT ===
  const current = txns.filter(filterCurrent);
  let cInc = 0, cExp = 0;
  current.forEach(t => {
    cInc += parseFloat(t.income_amount || 0);
    cExp += parseFloat(t.expense_amount || 0);
  });
  const cClose = BANK.current.opening + cInc - cExp;
  
  console.log('\n=== CURRENT ACCOUNT (支票戶口) ===');
  console.log('                    Bank Statement    Intranet       Diff');
  console.log('Opening:            $' + BANK.current.opening.toFixed(2).padStart(10) + '    $' + BANK.current.opening.toFixed(2).padStart(10));
  console.log('Income:             $' + BANK.current.income.toFixed(2).padStart(10) + '    $' + cInc.toFixed(2).padStart(10) + '    $' + (BANK.current.income - cInc).toFixed(2).padStart(8));
  console.log('Expense:            $' + BANK.current.expense.toFixed(2).padStart(10) + '    $' + cExp.toFixed(2).padStart(10) + '    $' + (BANK.current.expense - cExp).toFixed(2).padStart(8));
  console.log('Closing:            $' + BANK.current.closing.toFixed(2).padStart(10) + '    $' + cClose.toFixed(2).padStart(10) + '    $' + (BANK.current.closing - cClose).toFixed(2).padStart(8) + (Math.abs(BANK.current.closing - cClose) < 1 ? ' ✅' : ' ❌'));
  
  console.log('\n=== TRANSACTION COUNTS ===');
  console.log('Savings: ' + savings.length + ' transactions');
  console.log('Current: ' + current.length + ' transactions');
}

reconcile().catch(console.error);
