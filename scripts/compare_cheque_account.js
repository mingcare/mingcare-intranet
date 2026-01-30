const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 支票戶口月結單 2025年4月 - 支票兌現記錄
const chequeWithdrawals = [
  { date: '2025-04-01', amount: 46, chequeNo: '54' },
  { date: '2025-04-09', amount: 3190, chequeNo: '56' },
  { date: '2025-04-09', amount: 800, chequeNo: '58' },
  { date: '2025-04-15', amount: 5980, chequeNo: '57' },
  { date: '2025-04-26', amount: 700, chequeNo: '61' },
  { date: '2025-04-28', amount: 600, chequeNo: '63' },
  { date: '2025-04-29', amount: 200, chequeNo: '62' },
];

async function compareCheques() {
  console.log('=========================================');
  console.log('  支票戶口對比 (用金額查找)');
  console.log('=========================================\n');

  for (const cheque of chequeWithdrawals) {
    // 查找數據庫中相同金額的支出記錄
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('journal_number, transaction_date, transaction_item, expense_amount, payment_method')
      .eq('expense_amount', cheque.amount)
      .gte('transaction_date', '2025-03-01')
      .lte('transaction_date', '2025-05-31')
      .order('transaction_date', { ascending: true });

    console.log(`\n📌 支票 #${cheque.chequeNo} | 兌現日期: ${cheque.date} | 金額: $${cheque.amount}`);
    console.log('   數據庫匹配記錄:');
    
    if (data && data.length > 0) {
      data.forEach(t => {
        const status = t.payment_method === '支票' ? '✅' : '❌';
        console.log(`   ${status} ${t.journal_number} | ${t.transaction_date} | ${t.transaction_item} | 付款方式: ${t.payment_method}`);
      });
    } else {
      console.log('   ⚠️ 找不到匹配記錄');
    }
  }
}

compareCheques();
