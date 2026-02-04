const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 5月儲蓄戶口
  const bankOpening = 103530.96;
  const bankClosing = 41078.53;
  const bankChange = bankClosing - bankOpening; // -62452.43
  
  console.log('=== 5月份儲蓄戶口分析 ===\n');
  console.log('銀行結單:');
  console.log(`  開始: $${bankOpening.toFixed(2)}`);
  console.log(`  結束: $${bankClosing.toFixed(2)}`);
  console.log(`  需要嘅淨變動: $${bankChange.toFixed(2)}`);
  
  // 數據庫記錄
  const { data: records } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, payment_method, income_category, expense_category')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');
  
  let dbIncome = 0;
  let dbExpense = 0;
  
  records.forEach(r => {
    dbIncome += Number(r.income_amount) || 0;
    dbExpense += Number(r.expense_amount) || 0;
  });
  
  const dbChange = dbIncome - dbExpense;
  const dbClosing = bankOpening + dbChange;
  
  console.log('\n數據庫 (銀行轉賬):');
  console.log(`  總收入: $${dbIncome.toFixed(2)}`);
  console.log(`  總支出: $${dbExpense.toFixed(2)}`);
  console.log(`  淨變動: $${dbChange.toFixed(2)}`);
  console.log(`  計算結餘: $${dbClosing.toFixed(2)}`);
  
  const diff = dbClosing - bankClosing;
  console.log(`\n差異: $${diff.toFixed(2)}`);
  
  // 需要淨支出 -62452.43
  // 實際淨變動 -61852.43
  // 多咗 $600 收入，或少咗 $600 支出
  
  console.log('\n=== 搜尋 $600 相關交易 ===');
  
  const around600 = records.filter(r => {
    const inc = Number(r.income_amount) || 0;
    const exp = Number(r.expense_amount) || 0;
    return (inc >= 580 && inc <= 620) || (exp >= 580 && exp <= 620) ||
           inc === 600 || exp === 600 || inc === 300 || exp === 300;
  });
  
  console.log('\n$600 或 $300 相關記錄:');
  around600.forEach(r => {
    console.log(`${r.journal_number} | ${r.transaction_date} | Inc:$${r.income_amount} | Exp:$${r.expense_amount}`);
    console.log(`  ${r.transaction_item}`);
  });
  
  // 檢查係咪有 $600 收入唔應該係銀行轉賬
  console.log('\n=== 按收入類別分組 ===');
  const byIncCat = {};
  records.forEach(r => {
    const cat = r.income_category || '(無)';
    if (!byIncCat[cat]) byIncCat[cat] = { total: 0, count: 0 };
    byIncCat[cat].total += Number(r.income_amount) || 0;
    byIncCat[cat].count++;
  });
  
  Object.entries(byIncCat).forEach(([cat, data]) => {
    if (data.total > 0) {
      console.log(`  ${cat}: $${data.total.toFixed(2)} (${data.count}筆)`);
    }
  });
  
  console.log('\n=== 按支出類別分組 ===');
  const byExpCat = {};
  records.forEach(r => {
    const cat = r.expense_category || '(無)';
    if (!byExpCat[cat]) byExpCat[cat] = { total: 0, count: 0 };
    byExpCat[cat].total += Number(r.expense_amount) || 0;
    byExpCat[cat].count++;
  });
  
  Object.entries(byExpCat).forEach(([cat, data]) => {
    if (data.total > 0) {
      console.log(`  ${cat}: $${data.total.toFixed(2)} (${data.count}筆)`);
    }
  });
})();
