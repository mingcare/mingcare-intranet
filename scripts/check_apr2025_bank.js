const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  // Only get transactions with transaction_date in April 2025
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('billing_month', '2025年4月')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date')
    .order('sort_order');

  if (error) { console.error(error); return; }

  console.log('=== 2025年4月 銀行轉賬交易 ===\n');
  console.log('記錄數:', data.length, '\n');
  
  let totalIncome = 0, totalExpense = 0;
  
  console.log('日期\t\t流水號\t\t項目\t\t\t\t\t\t收入\t\t支出');
  console.log('-'.repeat(100));
  
  data.forEach(t => {
    const inc = parseFloat(t.income_amount) || 0;
    const exp = parseFloat(t.expense_amount) || 0;
    totalIncome += inc;
    totalExpense += exp;
    const item = (t.transaction_item || '').substring(0,40).padEnd(40);
    console.log(`${t.transaction_date}\t${t.journal_number}\t${item}\t${inc > 0 ? '+'+inc.toFixed(2) : ''}\t\t${exp > 0 ? '-'+exp.toFixed(2) : ''}`);
  });
  
  console.log('-'.repeat(100));
  console.log('\n系統記錄:');
  console.log('  總收入:', totalIncome.toFixed(2));
  console.log('  總支出:', totalExpense.toFixed(2));
  console.log('  淨額:', (totalIncome - totalExpense).toFixed(2));
  
  console.log('\n銀行結單 (2025年4月):');
  console.log('  開戶結餘 (31-Mar): $82,755.59');
  console.log('  結單結餘 (30-Apr): $103,530.96');
  console.log('  總存入: $182,468.61');
  console.log('  總支出: $161,693.24');
  console.log('  淨變化: $20,775.37');
  
  console.log('\n差異分析:');
  console.log('  系統淨額 vs 銀行淨變化:', ((totalIncome - totalExpense) - 20775.37).toFixed(2));
}

main().catch(console.error);
