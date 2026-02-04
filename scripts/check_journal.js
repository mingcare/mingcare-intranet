const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  // journal_number 係流水號，唔係 id (uuid)
  const journalNumbers = ['00000683', '00000694', '00000718'];
  
  console.log('查詢 journal_number 流水號記錄：\n');
  
  for (const jn of journalNumbers) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('journal_number', jn)
      .single();

    if (error) {
      console.log(`❌ journal_number ${jn}: 找不到`);
      continue;
    }

    console.log(`流水號: ${data.journal_number}`);
    console.log(`  交易日期: ${data.transaction_date}`);
    console.log(`  帳單月份: ${data.billing_month}`);
    console.log(`  收入金額: $${data.income_amount || 0}`);
    console.log(`  支出金額: $${data.expense_amount || 0}`);
    console.log(`  付款方式: ${data.payment_method}`);
    console.log(`  收入類別: ${data.income_category || '-'}`);
    console.log(`  支出類別: ${data.expense_category || '-'}`);
    console.log(`  交易項目: ${data.transaction_item}`);
    console.log(`  is_deleted: ${data.is_deleted}`);
    console.log('');
  }
}

main().catch(console.error);
