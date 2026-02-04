const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function fix667() {
  // 先查看記錄 667
  const { data: before, error: err1 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '667')
    .single();

  if (err1) {
    console.log('❌ Error finding record 667:', err1.message);
    return;
  }

  console.log('📋 修改前 記錄 667:');
  console.log('   日期:', before.transaction_date);
  console.log('   項目:', before.transaction_item);
  console.log('   支出:', before.expense_amount);
  console.log('   payment_method:', before.payment_method);
  console.log('   deduct_from_petty_cash:', before.deduct_from_petty_cash);

  // 更新為零用金交易
  // 零用金期初餘額 1999.89，減去 197.40 = 1802.49
  const { data: updated, error: err2 } = await supabase
    .from('financial_transactions')
    .update({
      payment_method: '現金',
      deduct_from_petty_cash: true
    })
    .eq('journal_number', '667')
    .select();

  if (err2) {
    console.log('❌ Update error:', err2.message);
    return;
  }

  console.log('\n✅ 已更新記錄 667 為零用金交易:');
  console.log('   payment_method:', updated[0].payment_method);
  console.log('   deduct_from_petty_cash:', updated[0].deduct_from_petty_cash);
  console.log('\n💵 零用金計算:');
  console.log('   期初餘額: $1,999.89');
  console.log('   - 支出: $197.40');
  console.log('   = 餘額: $1,802.49');
}

fix667();
