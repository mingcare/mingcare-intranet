const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

const LEDGER_OPENING_BALANCE = 82755.59;
const DISPLAY_START_DATE = '2025-04-01';

async function main() {
  // 模擬 getLedgerTransactions() 嘅 logic (accountType = 'savings')
  const { data: allTransactions, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  // 篩選儲蓄戶口交易 (模擬 accountType === 'savings')
  const savingsTransactions = allTransactions.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    const isCashPayment = paymentMethod === '現金';

    // 基本篩選：銀行轉賬、支票、空白、非零用金現金
    const isLedgerTransaction = (
      paymentMethod === '銀行轉賬' ||
      paymentMethod === '支票' ||
      !paymentMethod || // 付款方式為空的顯示在流水帳
      (isCashPayment && t.deduct_from_petty_cash === false)
    );

    if (!isLedgerTransaction) return false;

    // 儲蓄戶口篩選
    if (paymentMethod === '支票') {
      // 支票收入（income_amount > 0）入儲蓄戶口，但排除內部轉帳
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return true; // 銀行轉賬等其他付款方式
  }).filter(t => t.transaction_date >= DISPLAY_START_DATE);

  // 只看 2025年4月
  const apr2025 = savingsTransactions.filter(t => 
    t.transaction_date >= '2025-04-01' && t.transaction_date <= '2025-04-30'
  );

  console.log('='.repeat(80));
  console.log('模擬 Intranet 儲蓄戶口 2025年4月 計算');
  console.log('='.repeat(80));

  let totalIncome = 0;
  let totalExpense = 0;

  console.log('\n交易清單:');
  apr2025.forEach(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    totalIncome += income;
    totalExpense += expense;
    
    if (income > 0 || expense > 0) {
      console.log(`${t.journal_number} | ${t.transaction_date} | 收$${income.toFixed(2).padStart(10)} | 支$${expense.toFixed(2).padStart(10)} | ${t.payment_method || '(空)'} | ${t.transaction_item?.substring(0,25)}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('統計:');
  console.log('='.repeat(80));
  console.log(`交易筆數: ${apr2025.length}`);
  console.log(`總收入: $${totalIncome.toFixed(2)}`);
  console.log(`總支出: $${totalExpense.toFixed(2)}`);
  console.log(`淨額: $${(totalIncome - totalExpense).toFixed(2)}`);

  console.log('\n餘額計算:');
  console.log(`期初餘額: $${LEDGER_OPENING_BALANCE.toFixed(2)}`);
  console.log(`+ 收入: $${totalIncome.toFixed(2)}`);
  console.log(`- 支出: $${totalExpense.toFixed(2)}`);
  const endingBalance = LEDGER_OPENING_BALANCE + totalIncome - totalExpense;
  console.log(`= 期末餘額: $${endingBalance.toFixed(2)}`);

  console.log('\n目標:');
  console.log(`銀行結單結餘: $103,530.96`);
  console.log(`差異: $${(endingBalance - 103530.96).toFixed(2)}`);

  // 檢查 Petty Cash 交易
  console.log('\n\n' + '='.repeat(80));
  console.log('Petty Cash 相關交易:');
  console.log('='.repeat(80));
  
  const pettyCashTxns = apr2025.filter(t => 
    t.expense_category === 'Petty Cash' || 
    t.transaction_item?.includes('Petty Cash') ||
    t.transaction_item?.includes('petty cash')
  );
  
  pettyCashTxns.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | 收$${t.income_amount || 0} | 支$${t.expense_amount || 0} | ${t.payment_method} | ${t.expense_category} | ${t.transaction_item}`);
  });
}

main().catch(console.error);
