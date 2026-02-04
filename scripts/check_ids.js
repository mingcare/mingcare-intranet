const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  const ids = ['00000683', '00000694', '00000718'];
  
  console.log('查詢指定ID的記錄：\n');
  
  for (const id of ids) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log(`❌ ID ${id}: 找不到`);
      continue;
    }

    console.log(`ID: ${data.id}`);
    console.log(`  日期: ${data.transaction_date}`);
    console.log(`  billing_month: ${data.billing_month}`);
    console.log(`  收入: $${data.income_amount || 0}`);
    console.log(`  支出: $${data.expense_amount || 0}`);
    console.log(`  付款方式: ${data.payment_method}`);
    console.log(`  item_name: ${data.item_name}`);
    console.log(`  is_deleted: ${data.is_deleted}`);
    console.log('');
  }
}

main().catch(console.error);
