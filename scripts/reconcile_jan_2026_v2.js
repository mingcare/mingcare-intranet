const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// Bank Statement Data - January 2026
const BANK = {
  current: { 
    opening: 1757.04, 
    closing: 1757.04,
    note: 'No Transactions In This Month'
  }
};

const MONTH_START = '2026-01-01';
const MONTH_END = '2026-01-31';

async function reconcile() {
  console.log('=== 2026年1月 銀行對帳 ===\n');
  
  const { data: txns, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', MONTH_START)
    .lte('transaction_date', MONTH_END)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('總交易筆數:', txns.length);

  // ==================== 支票戶口 ====================
  console.log('\n========== 支票戶口 (Current Account) ==========');
  console.log('Bank Opening:', BANK.current.opening);
  console.log('Bank Closing:', BANK.current.closing);
  console.log('Bank Note:', BANK.current.note);
  
  // Current filter: 支票expense + 內部轉帳income
  const currentTxns = txns.filter(t => {
    if (t.payment_method === '支票' && t.expense_amount > 0) return true;
    if (t.payment_method === '支票' && t.income_amount > 0 && t.income_category === '內部轉帳') return true;
    return false;
  });

  const currentIncome = currentTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const currentExpense = currentTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const currentClosing = BANK.current.opening + currentIncome - currentExpense;

  console.log('\nIntranet 支票戶口交易:');
  if (currentTxns.length === 0) {
    console.log('  (冇交易)');
  } else {
    currentTxns.forEach(t => {
      const inc = t.income_amount || 0;
      const exp = t.expense_amount || 0;
      console.log(`  ${t.journal_number} | ${t.transaction_date} | ${t.transaction_item?.substring(0,30)} | +${inc} -${exp}`);
    });
  }

  console.log('\n計算:');
  console.log('  Opening:', BANK.current.opening);
  console.log('  + Income:', currentIncome);
  console.log('  - Expense:', currentExpense);
  console.log('  = Closing:', currentClosing);
  
  const currentDiff = currentClosing - BANK.current.closing;
  if (Math.abs(currentDiff) < 0.01) {
    console.log('\n✅ 支票戶口 MATCH!');
  } else {
    console.log('\n❌ 支票戶口差異:', currentDiff);
  }

  // ==================== 儲蓄戶口 (暫時用12月closing) ====================
  console.log('\n========== 儲蓄戶口 (Savings Account) ==========');
  console.log('(需要儲蓄戶口1月份月結單)');
  
  // 用12月closing作為1月opening
  const savingsOpening = 161604.07; // Dec 2025 closing
  
  // Savings filter
  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬' && t.deduct_from_petty_cash !== true) return true;
    if (t.payment_method === '支票' && t.income_amount > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const savingsIncome = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const savingsExpense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const savingsClosing = savingsOpening + savingsIncome - savingsExpense;

  console.log('\nIntranet 儲蓄戶口交易數:', savingsTxns.length);
  console.log('  Opening (Dec closing):', savingsOpening);
  console.log('  + Income:', savingsIncome);
  console.log('  - Expense:', savingsExpense);
  console.log('  = Closing:', savingsClosing);

  // 列出所有1月儲蓄交易
  console.log('\n儲蓄戶口明細:');
  savingsTxns.forEach(t => {
    const inc = t.income_amount || 0;
    const exp = t.expense_amount || 0;
    console.log(`  ${t.journal_number} | ${t.transaction_date} | ${t.payment_method} | ${t.transaction_item?.substring(0,25)} | +${inc} -${exp}`);
  });
}

reconcile();
