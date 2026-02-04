const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

const LEDGER_OPENING_BALANCE = 82755.59;
const DISPLAY_START_DATE = '2025-04-01';

async function main() {
  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  // 模擬 getLedgerTransactions() - accountType = 'savings'
  const savingsTransactions = transactions.filter(t => {
    const paymentMethod = (t.payment_method || '').trim();
    const isCashPayment = paymentMethod === '現金';

    // 基本篩選
    const isLedgerTransaction = (
      paymentMethod === '銀行轉賬' ||
      paymentMethod === '支票' ||
      !paymentMethod ||
      (isCashPayment && t.deduct_from_petty_cash === false)
    );

    if (!isLedgerTransaction) return false;

    // 儲蓄戶口篩選
    if (paymentMethod === '支票') {
      return (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳';
    }
    return true;
  });

  console.log('='.repeat(80));
  console.log('Intranet 儲蓄戶口 Logic 分析 - 2025年4月');
  console.log('='.repeat(80));

  // 分類交易
  const bankTransfer = savingsTransactions.filter(t => t.payment_method === '銀行轉賬');
  const cheque = savingsTransactions.filter(t => t.payment_method === '支票');
  const cash = savingsTransactions.filter(t => t.payment_method === '現金');
  const empty = savingsTransactions.filter(t => !t.payment_method || t.payment_method.trim() === '');

  console.log(`\n總交易筆數: ${savingsTransactions.length}`);
  console.log(`  - 銀行轉賬: ${bankTransfer.length} 筆`);
  console.log(`  - 支票: ${cheque.length} 筆`);
  console.log(`  - 現金 (deduct_from_petty_cash=false): ${cash.length} 筆`);
  console.log(`  - 付款方式空白: ${empty.length} 筆`);

  // 計算各類收支
  const calcStats = (arr) => {
    const income = arr.reduce((s, t) => s + (parseFloat(t.income_amount) || 0), 0);
    const expense = arr.reduce((s, t) => s + (parseFloat(t.expense_amount) || 0), 0);
    return { income, expense, net: income - expense };
  };

  const bankStats = calcStats(bankTransfer);
  const chequeStats = calcStats(cheque);
  const cashStats = calcStats(cash);
  const emptyStats = calcStats(empty);
  const totalStats = calcStats(savingsTransactions);

  console.log('\n【各類型收支】');
  console.log(`銀行轉賬: 收入 $${bankStats.income.toFixed(2)} | 支出 $${bankStats.expense.toFixed(2)} | 淨額 $${bankStats.net.toFixed(2)}`);
  console.log(`支票:     收入 $${chequeStats.income.toFixed(2)} | 支出 $${chequeStats.expense.toFixed(2)} | 淨額 $${chequeStats.net.toFixed(2)}`);
  console.log(`現金:     收入 $${cashStats.income.toFixed(2)} | 支出 $${cashStats.expense.toFixed(2)} | 淨額 $${cashStats.net.toFixed(2)}`);
  console.log(`空白:     收入 $${emptyStats.income.toFixed(2)} | 支出 $${emptyStats.expense.toFixed(2)} | 淨額 $${emptyStats.net.toFixed(2)}`);
  console.log('─'.repeat(80));
  console.log(`總計:     收入 $${totalStats.income.toFixed(2)} | 支出 $${totalStats.expense.toFixed(2)} | 淨額 $${totalStats.net.toFixed(2)}`);

  // 期末餘額
  const endingBalance = LEDGER_OPENING_BALANCE + totalStats.net;
  console.log(`\n【餘額計算】`);
  console.log(`期初: $${LEDGER_OPENING_BALANCE.toFixed(2)}`);
  console.log(`+ 淨額: $${totalStats.net.toFixed(2)}`);
  console.log(`= 期末: $${endingBalance.toFixed(2)}`);

  console.log(`\n【對比銀行結單】`);
  console.log(`銀行結單結餘: $103,530.96`);
  console.log(`Intranet 顯示: $${endingBalance.toFixed(2)}`);
  console.log(`差異: $${(endingBalance - 103530.96).toFixed(2)}`);

  // 列出非銀行轉賬交易
  if (cash.length > 0) {
    console.log('\n【現金交易明細】(deduct_from_petty_cash = false):');
    cash.forEach(t => {
      console.log(`  ${t.journal_number} | ${t.transaction_date} | 收$${t.income_amount || 0} | 支$${t.expense_amount || 0} | ${t.income_category || t.expense_category} | ${t.transaction_item?.substring(0,30)}`);
    });
  }

  if (empty.length > 0) {
    console.log('\n【付款方式空白交易明細】:');
    empty.forEach(t => {
      console.log(`  ${t.journal_number} | ${t.transaction_date} | 收$${t.income_amount || 0} | 支$${t.expense_amount || 0} | ${t.transaction_item?.substring(0,30)}`);
    });
  }

  // 純銀行轉賬計算
  console.log('\n\n' + '='.repeat(80));
  console.log('【如果只計銀行轉賬】');
  console.log('='.repeat(80));
  const pureEndingBalance = LEDGER_OPENING_BALANCE + bankStats.net;
  console.log(`期初: $${LEDGER_OPENING_BALANCE.toFixed(2)}`);
  console.log(`+ 銀行轉賬淨額: $${bankStats.net.toFixed(2)}`);
  console.log(`= 期末: $${pureEndingBalance.toFixed(2)}`);
  console.log(`銀行結單: $103,530.96`);
  console.log(`差異: $${(pureEndingBalance - 103530.96).toFixed(2)}`);
}

main().catch(console.error);
