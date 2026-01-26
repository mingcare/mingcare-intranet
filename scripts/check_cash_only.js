const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function checkAll() {
  // Get ALL cash transactions (payment_method = '現金')
  const { data: allData, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('payment_method', '現金')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // 排除已轉到流水帳的項目 (deduct_from_petty_cash === false)
  const data = allData.filter(t => t.deduct_from_petty_cash !== false);
  
  console.log('所有現金交易統計 (排除已轉流水帳):');
  console.log('─'.repeat(60));
  console.log('總現金交易:', allData.length);
  console.log('已轉流水帳:', allData.length - data.length);
  console.log('零用金交易:', data.length);
  console.log('最早交易日期:', data[0]?.transaction_date);
  console.log('最新交易日期:', data[data.length - 1]?.transaction_date);
  
  let totalIn = 0;
  let totalOut = 0;
  
  data.forEach(t => {
    totalIn += t.income_amount || 0;
    totalOut += t.expense_amount || 0;
  });
  
  const currentBalance = totalIn - totalOut;
  const targetBalance = 2284.93;
  const adjustment = targetBalance - currentBalance;
  
  console.log('─'.repeat(60));
  console.log('總現金收入:', totalIn.toFixed(2));
  console.log('總現金支出:', totalOut.toFixed(2));
  console.log('目前餘額:', currentBalance.toFixed(2));
  console.log('目標餘額:', targetBalance.toFixed(2));
  console.log('需要調整:', adjustment.toFixed(2));
  console.log('─'.repeat(60));
  
  // Find earliest date
  const earliestDate = data[0]?.transaction_date;
  if (earliestDate) {
    const d = new Date(earliestDate);
    d.setDate(d.getDate() - 1);
    const adjustmentDate = d.toISOString().split('T')[0];
    console.log('建議調整交易日期:', adjustmentDate);
    console.log('調整金額 (現金收入):', adjustment.toFixed(2));
  }
}

checkAll();
