const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

const LEDGER_OPENING_BALANCE = 82755.59;

async function main() {
  // 重新計算 (刪除 AIA 後)
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date');

  if (error) { console.error(error); return; }

  let totalIncome = 0;
  let totalExpense = 0;

  data.forEach(t => {
    totalIncome += parseFloat(t.income_amount) || 0;
    totalExpense += parseFloat(t.expense_amount) || 0;
  });

  console.log('='.repeat(60));
  console.log('刪除 AIA 重複後 - 2025年4月 儲蓄戶口 銀行轉賬');
  console.log('='.repeat(60));
  console.log(`交易筆數: ${data.length}`);
  console.log(`總收入: $${totalIncome.toFixed(2)}`);
  console.log(`總支出: $${totalExpense.toFixed(2)}`);
  console.log(`淨額: $${(totalIncome - totalExpense).toFixed(2)}`);

  console.log('\n餘額計算:');
  console.log(`期初: $${LEDGER_OPENING_BALANCE.toFixed(2)}`);
  console.log(`+ 收入: $${totalIncome.toFixed(2)}`);
  console.log(`- 支出: $${totalExpense.toFixed(2)}`);
  const endingBalance = LEDGER_OPENING_BALANCE + totalIncome - totalExpense;
  console.log(`= 期末: $${endingBalance.toFixed(2)}`);

  console.log('\n目標:');
  console.log(`銀行結單: $103,530.96`);
  console.log(`差異: $${(endingBalance - 103530.96).toFixed(2)}`);

  // 但係呢個計算冇包含 00000744 現金收入
  // 因為佢付款方式係「現金」唔係「銀行轉賬」
  
  console.log('\n' + '='.repeat(60));
  console.log('完整流水帳計算 (包括 deduct_from_petty_cash = false 的現金)');
  console.log('='.repeat(60));
  
  // 模擬完整的 getLedgerTransactions logic
  const { data: allData, error: allError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date');

  if (allError) { console.error(allError); return; }

  const ledgerData = allData.filter(t => {
    const pm = (t.payment_method || '').trim();
    return (
      pm === '銀行轉賬' ||
      pm === '支票' ||
      !pm ||
      (pm === '現金' && t.deduct_from_petty_cash === false)
    );
  });

  let ledgerIncome = 0;
  let ledgerExpense = 0;

  ledgerData.forEach(t => {
    ledgerIncome += parseFloat(t.income_amount) || 0;
    ledgerExpense += parseFloat(t.expense_amount) || 0;
  });

  console.log(`交易筆數: ${ledgerData.length}`);
  console.log(`總收入: $${ledgerIncome.toFixed(2)}`);
  console.log(`總支出: $${ledgerExpense.toFixed(2)}`);

  const ledgerEndingBalance = LEDGER_OPENING_BALANCE + ledgerIncome - ledgerExpense;
  console.log(`\n期初: $${LEDGER_OPENING_BALANCE.toFixed(2)}`);
  console.log(`期末: $${ledgerEndingBalance.toFixed(2)}`);
  console.log(`\n銀行結單: $103,530.96`);
  console.log(`差異: $${(ledgerEndingBalance - 103530.96).toFixed(2)}`);

  // 列出現金交易
  const cashTxns = ledgerData.filter(t => t.payment_method === '現金');
  if (cashTxns.length > 0) {
    console.log('\n現金交易 (deduct_from_petty_cash = false):');
    cashTxns.forEach(t => {
      console.log(`  ${t.journal_number} | ${t.transaction_date} | 收$${t.income_amount || 0} | 支$${t.expense_amount || 0} | ${t.transaction_item?.substring(0,30)}`);
    });
  }
}

main().catch(console.error);
