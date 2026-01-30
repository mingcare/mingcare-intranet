const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 這些是數據庫有但銀行4月份沒有的交易 - 應該是支票
const chequeTransactions = [
  { journal: '00000688', item: '馮炎英 3月份工資', amount: 3190 },
  { journal: '00000689', item: '劉建群 3月份工資', amount: 5980 },
  { journal: '00000690', item: '譚遠 3月份工資', amount: 800 },
  { journal: '00000691', item: '戚家威 3月份工資', amount: 700 },
  { journal: '00000692', item: '蒲小宇 3月份工資', amount: 2800 },
];

async function updateToChequePay() {
  for (const t of chequeTransactions) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ payment_method: '支票' })
      .eq('journal_number', t.journal)
      .select('journal_number, transaction_item, payment_method')
      .single();
    
    if (error) {
      console.log(`❌ ${t.journal} 更新失敗:`, error.message);
    } else {
      console.log(`✅ ${data.journal_number} | ${data.transaction_item} | 付款方式: ${data.payment_method}`);
    }
  }
}

updateToChequePay();
