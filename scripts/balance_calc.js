const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 開始結餘 (2025年3月31日)
const openingBalance = 82755.59;

// 銀行結單 4月30日結餘
const bankEndingBalance = 103530.96;

// Database 顯示結餘
const dbEndingBalance = 106455.96;

async function main() {
  // 查詢所有 2025年4月 銀行轉賬交易 (by transaction_date)
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  // 計算 DB 4月份收支
  let dbIncome = 0;
  let dbExpense = 0;
  
  data.forEach(t => {
    dbIncome += parseFloat(t.income_amount) || 0;
    dbExpense += parseFloat(t.expense_amount) || 0;
  });

  // 銀行結單 4月份收支
  const bankIncome = 159978.61;
  const bankExpense = 135663.24 + 100; // 包括 FPS 手續費

  console.log('='.repeat(80));
  console.log('Balance 計算 (從開始結餘 $82,755.59 開始)');
  console.log('='.repeat(80));
  
  console.log('\n【銀行結單】');
  console.log(`  開始結餘 (31-Mar): $${openingBalance.toFixed(2)}`);
  console.log(`  + 4月存入:         $${bankIncome.toFixed(2)}`);
  console.log(`  - 4月支出:         $${bankExpense.toFixed(2)}`);
  const bankCalc = openingBalance + bankIncome - bankExpense;
  console.log(`  = 計算結餘:        $${bankCalc.toFixed(2)}`);
  console.log(`  實際結餘:          $${bankEndingBalance.toFixed(2)}`);
  console.log(`  差異:              $${(bankCalc - bankEndingBalance).toFixed(2)}`);

  console.log('\n【Database】');
  console.log(`  開始結餘 (31-Mar): $${openingBalance.toFixed(2)}`);
  console.log(`  + 4月收入:         $${dbIncome.toFixed(2)}`);
  console.log(`  - 4月支出:         $${dbExpense.toFixed(2)}`);
  const dbCalc = openingBalance + dbIncome - dbExpense;
  console.log(`  = 計算結餘:        $${dbCalc.toFixed(2)}`);
  console.log(`  顯示結餘:          $${dbEndingBalance.toFixed(2)}`);
  console.log(`  差異:              $${(dbEndingBalance - dbCalc).toFixed(2)}`);

  console.log('\n【對比】');
  console.log(`  銀行結單結餘: $${bankEndingBalance.toFixed(2)}`);
  console.log(`  Database結餘: $${dbEndingBalance.toFixed(2)}`);
  console.log(`  差異:         $${(dbEndingBalance - bankEndingBalance).toFixed(2)}`);

  // 收支差異分析
  console.log('\n\n【收支差異分析】');
  console.log(`  收入差異: DB $${dbIncome.toFixed(2)} vs 銀行 $${bankIncome.toFixed(2)} = $${(dbIncome - bankIncome).toFixed(2)}`);
  console.log(`  支出差異: DB $${dbExpense.toFixed(2)} vs 銀行 $${bankExpense.toFixed(2)} = $${(dbExpense - bankExpense).toFixed(2)}`);

  // 差異來源
  console.log('\n\n【差異來源】');
  console.log('DB比銀行少收入 (銀行有，DB冇):');
  console.log('  07-Apr $3,430 CR Refund');
  console.log('  合計: -$3,430');
  
  console.log('\nDB比銀行多收入 (DB有，銀行冇):');
  console.log('  (無，因為05-Apr $1,040 WONG OI YING = DB 07-Apr $1,040 00000694)');
  
  console.log('\nDB比銀行少支出 (銀行有，DB冇):');
  console.log('  (無，所有銀行支出都match到DB)');
  
  console.log('\nDB比銀行多支出 (DB有，銀行冇):');
  console.log('  03-Apr $2,800 蒲小宇 (00000690)');
  console.log('  24-Apr $75 AIA重複 (00001827)');
  console.log('  30-Apr $10 銀行手續費多 (DB $110 vs 銀行 $100)');
  console.log('  合計: +$2,885 支出');

  console.log('\n\n【結餘差異解釋】');
  console.log(`  DB少收入 $3,430 (CR Refund)`);
  console.log(`  DB多支出 $2,885`);
  console.log(`  淨影響: DB應該比銀行低 $${(3430 + 2885).toFixed(2)} = 但實際DB高 $${(dbEndingBalance - bankEndingBalance).toFixed(2)}`);
  
  console.log('\n\n⚠️ 問題：計算唔match！');
  console.log('讓我check下DB顯示嘅結餘係點計出嚟...');
  
  // 反推：如果DB結餘係$106,455.96，開始結餘$82,755.59
  // 淨變化 = $106,455.96 - $82,755.59 = $23,700.37
  const dbNetChange = dbEndingBalance - openingBalance;
  console.log(`\n反推DB淨變化: $${dbEndingBalance.toFixed(2)} - $${openingBalance.toFixed(2)} = $${dbNetChange.toFixed(2)}`);
  console.log(`DB計算淨變化: $${dbIncome.toFixed(2)} - $${dbExpense.toFixed(2)} = $${(dbIncome - dbExpense).toFixed(2)}`);
  console.log(`差異: $${(dbNetChange - (dbIncome - dbExpense)).toFixed(2)}`);
  
  // 如果差異是 $3,000，可能係有筆 $3,000 嘅交易
  const diff = dbNetChange - (dbIncome - dbExpense);
  console.log(`\n查找金額 = $${diff.toFixed(2)} 的交易:`);
  
  const matchingTxn = data.filter(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    return Math.abs(income - Math.abs(diff)) < 1 || Math.abs(expense - Math.abs(diff)) < 1;
  });
  
  if (matchingTxn.length > 0) {
    matchingTxn.forEach(t => {
      const income = parseFloat(t.income_amount) || 0;
      const expense = parseFloat(t.expense_amount) || 0;
      console.log(`  ${t.journal_number} | ${t.transaction_date} | 收$${income} 支$${expense} | ${t.transaction_item?.substring(0,30)}`);
    });
  }

  // 08-Apr $3,000 Petty Cash
  console.log('\n\n🔍 發現：08-Apr $3,000 Petty Cash (00000701)');
  console.log('呢筆係「公司戶口轉帳」到 Petty Cash');
  console.log('銀行結單有呢筆支出，DB都有');
  console.log('但係...佢係咪應該計入儲蓄戶口balance?');
}

main().catch(console.error);
