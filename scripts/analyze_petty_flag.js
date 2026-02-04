const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

(async () => {
  // 統計 deduct_from_petty_cash 的分佈
  const { data: allRecords } = await supabase.from('financial_transactions')
    .select('deduct_from_petty_cash, payment_method, income_amount, expense_amount')
    .eq('is_deleted', false);
  
  console.log('=== deduct_from_petty_cash 統計 ===\n');
  
  const stats = {
    true: { count: 0, income: 0, expense: 0 },
    false: { count: 0, income: 0, expense: 0 },
    null: { count: 0, income: 0, expense: 0 }
  };
  
  const byMethod = {};
  
  allRecords?.forEach(t => {
    const key = t.deduct_from_petty_cash === true ? 'true' : 
                t.deduct_from_petty_cash === false ? 'false' : 'null';
    stats[key].count++;
    stats[key].income += t.income_amount || 0;
    stats[key].expense += t.expense_amount || 0;
    
    const method = t.payment_method || 'null';
    if (!byMethod[method]) byMethod[method] = { true: 0, false: 0, null: 0 };
    byMethod[method][key]++;
  });
  
  console.log('deduct_from_petty_cash = true:');
  console.log(`  記錄數: ${stats.true.count}`);
  console.log(`  收入: $${stats.true.income.toLocaleString()}`);
  console.log(`  支出: $${stats.true.expense.toLocaleString()}`);
  
  console.log('\ndeduct_from_petty_cash = false:');
  console.log(`  記錄數: ${stats.false.count}`);
  console.log(`  收入: $${stats.false.income.toLocaleString()}`);
  console.log(`  支出: $${stats.false.expense.toLocaleString()}`);
  
  console.log('\ndeduct_from_petty_cash = null:');
  console.log(`  記錄數: ${stats.null.count}`);
  console.log(`  收入: $${stats.null.income.toLocaleString()}`);
  console.log(`  支出: $${stats.null.expense.toLocaleString()}`);
  
  console.log('\n=== 按 payment_method 分類 ===');
  Object.entries(byMethod).forEach(([method, counts]) => {
    console.log(`\n${method}:`);
    console.log(`  petty=true: ${counts.true}, petty=false: ${counts.false}, petty=null: ${counts.null}`);
  });
  
  // 需要修正的記錄：銀行轉賬 且 petty=true 的收入/支出
  const { data: wrongRecords } = await supabase.from('financial_transactions')
    .select('id, transaction_date, transaction_item, payment_method, income_amount, expense_amount, deduct_from_petty_cash, expense_category')
    .eq('is_deleted', false)
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', true);
  
  console.log(`\n\n=== 需要修正的記錄 (銀行轉賬 + petty=true) ===`);
  console.log(`共 ${wrongRecords?.length || 0} 筆`);
  
  // 分析這些記錄
  let pettyCashReplenish = 0;
  let salaryRecords = 0;
  let otherRecords = 0;
  
  wrongRecords?.forEach(r => {
    if (r.expense_category === 'Petty Cash') {
      pettyCashReplenish++;
    } else if (r.transaction_item?.includes('工資') || r.transaction_item?.includes('強積金')) {
      salaryRecords++;
    } else {
      otherRecords++;
    }
  });
  
  console.log(`  零用金補充 (expense_category=Petty Cash): ${pettyCashReplenish} 筆 - 應保持 petty=true`);
  console.log(`  工資/強積金: ${salaryRecords} 筆 - 應改為 petty=false`);
  console.log(`  其他: ${otherRecords} 筆 - 應改為 petty=false`);
  
  process.exit(0);
})();
