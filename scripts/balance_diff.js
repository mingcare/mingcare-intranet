const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// Bank statement April 2025 - ending balance: $103,530.96
const bankStatementBalance = 103530.96;
const dbBalance = 106455.96;
const difference = dbBalance - bankStatementBalance; // $2,925

console.log('='.repeat(80));
console.log('Balance Difference Analysis');
console.log('='.repeat(80));
console.log(`Bank Statement Balance: $${bankStatementBalance.toFixed(2)}`);
console.log(`Database Balance:       $${dbBalance.toFixed(2)}`);
console.log(`Difference:             $${difference.toFixed(2)}`);
console.log('='.repeat(80));

async function main() {
  // Get all April 2025 bank transfer transactions
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

  // Calculate DB totals
  let dbIncome = 0;
  let dbExpense = 0;
  
  data.forEach(t => {
    dbIncome += parseFloat(t.income_amount) || 0;
    dbExpense += parseFloat(t.expense_amount) || 0;
  });

  console.log(`\nDatabase April 2025 銀行轉賬:`);
  console.log(`  總收入: $${dbIncome.toFixed(2)}`);
  console.log(`  總支出: $${dbExpense.toFixed(2)}`);
  console.log(`  淨額:   $${(dbIncome - dbExpense).toFixed(2)}`);

  // Bank statement totals (from previous analysis)
  const bankIncome = 159978.61;
  const bankExpense = 135663.24 + 100; // including FPS fees
  console.log(`\nBank Statement April 2025:`);
  console.log(`  總存入: $${bankIncome.toFixed(2)}`);
  console.log(`  總支出: $${bankExpense.toFixed(2)}`);
  console.log(`  淨額:   $${(bankIncome - bankExpense).toFixed(2)}`);

  console.log(`\n差異分析:`);
  console.log(`  收入差: $${(dbIncome - bankIncome).toFixed(2)}`);
  console.log(`  支出差: $${(dbExpense - bankExpense).toFixed(2)}`);

  // Find transactions that don't match
  console.log('\n\n' + '='.repeat(80));
  console.log('Database有但銀行結單冇的交易 (可能導致差異)');
  console.log('='.repeat(80));

  // These are the unmatched ones from previous analysis
  const unmatchedIncome = [
    { journal: '00000694', date: '2025-04-07', amt: 1040, item: 'MC20/05 王先生' }
  ];

  const unmatchedExpense = [
    { journal: '00000690', date: '2025-04-03', amt: 2800, item: '蒲小宇 3月份工資' },
    { journal: '00001827', date: '2025-04-24', amt: 75, item: 'AIA (重複)' },
    { journal: 'EX-0026', date: '2025-04-30', amt: 110, item: '銀行手續費 (銀行係$100)' }
  ];

  console.log('\n收入 (DB有，銀行冇):');
  unmatchedIncome.forEach(t => {
    console.log(`  ${t.journal} | ${t.date} | $${t.amt} | ${t.item}`);
  });
  const totalUnmatchedIncome = unmatchedIncome.reduce((s, t) => s + t.amt, 0);
  console.log(`  小計: $${totalUnmatchedIncome}`);

  console.log('\n支出 (DB有，銀行冇):');
  unmatchedExpense.forEach(t => {
    console.log(`  ${t.journal} | ${t.date} | $${t.amt} | ${t.item}`);
  });
  const totalUnmatchedExpense = unmatchedExpense.reduce((s, t) => s + t.amt, 0);
  console.log(`  小計: $${totalUnmatchedExpense}`);

  // CR Refund analysis
  console.log('\n\nCR Refund (銀行有，DB冇):');
  console.log('  07-Apr | $3,430 | CR Refund (一出一入抵銷)');

  console.log('\n\n' + '='.repeat(80));
  console.log('差額計算');
  console.log('='.repeat(80));
  
  // The difference is $2,925
  // Let's check what combination makes $2,925
  console.log(`\n目標差額: $${difference.toFixed(2)}`);
  
  // Possible combinations:
  // Extra income in DB = higher balance
  // Extra expense in DB = lower balance
  // DB balance is HIGHER than bank by $2,925
  
  // So DB has either:
  // - More income than bank by $2,925, OR
  // - Less expense than bank by $2,925
  
  // $1,040 (extra income) - $2,800 (extra expense) - $75 (extra AIA) - $10 (extra fee) 
  // = $1,040 - $2,885 = -$1,845 (this would make DB LOWER)
  
  // But DB is HIGHER by $2,925
  
  // Let me check the CR Refund situation:
  // Bank has CR Refund +$3,430 that DB doesn't have
  // But DB has expense -$3,430 (00000683) for 劉雪倪
  
  // If bank has +$3,430 income and DB doesn't, DB should be LOWER
  // But DB is HIGHER...
  
  console.log('\n分析:');
  console.log('DB比銀行高 $2,925');
  console.log('');
  console.log('可能原因:');
  console.log('1. DB多記了收入');
  console.log('2. DB少記了支出');
  console.log('3. 開始餘額不同');
  
  // Let me find transactions close to $2,925
  console.log('\n\n查找金額接近 $2,925 的交易:');
  
  const closeAmounts = data.filter(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    const amt = income || expense;
    return Math.abs(amt - 2925) < 200 || Math.abs(amt - 2800) < 200 || Math.abs(amt - 3000) < 200;
  });

  closeAmounts.forEach(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    const type = income > 0 ? '收入' : '支出';
    const amt = income || expense;
    console.log(`  ${t.journal_number} | ${t.transaction_date} | ${type} $${amt} | ${t.transaction_item?.substring(0,30)}`);
  });

  // Check $2,800 蒲小宇 - this is in DB but not matched to bank
  // Bank has 詹珍 $2,800 on 08-Apr
  // DB has 蒲小宇 $2,800 on 03-Apr
  // If these are DIFFERENT people, then:
  // - DB has extra $2,800 expense (蒲小宇)
  // This would make DB balance LOWER, not higher
  
  // So maybe the issue is:
  // - 蒲小宇 $2,800 should NOT be in DB for April?
  
  console.log('\n\n' + '='.repeat(80));
  console.log('關鍵問題：$2,800 蒲小宇');
  console.log('='.repeat(80));
  console.log('銀行結單: 08-Apr $2,800 詹珍');
  console.log('Database: 03-Apr $2,800 蒲小宇 (00000690)');
  console.log('');
  console.log('如果呢兩個係唔同人:');
  console.log('- 詹珍 $2,800 應該入DB但冇入');
  console.log('- 蒲小宇 $2,800 唔應該係4月?');
  
  // Actually let me recalculate properly
  // Bank: deposits - withdrawals - fees = net
  // $159,978.61 - $135,663.24 - $100 = $24,215.37 net gain in April
  
  // DB: income - expense = net  
  // Let me calculate exact DB amounts
  
  console.log('\n\n精確計算:');
  console.log(`DB 收入總計: $${dbIncome.toFixed(2)}`);
  console.log(`DB 支出總計: $${dbExpense.toFixed(2)}`);
  console.log(`DB 淨變化: $${(dbIncome - dbExpense).toFixed(2)}`);
  
  console.log(`\n銀行 存入總計: $${bankIncome.toFixed(2)}`);
  console.log(`銀行 支出總計: $${(bankExpense).toFixed(2)}`);
  console.log(`銀行 淨變化: $${(bankIncome - bankExpense).toFixed(2)}`);
  
  const netDiff = (dbIncome - dbExpense) - (bankIncome - bankExpense);
  console.log(`\n淨變化差異: $${netDiff.toFixed(2)}`);
}

main().catch(console.error);
