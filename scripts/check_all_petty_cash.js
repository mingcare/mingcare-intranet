const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function checkAll() {
  // Get ALL cash transactions (all years)
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Filter petty cash transactions
  const pettyCashTxns = data.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );
  
  console.log('所有零用金交易統計:');
  console.log('─'.repeat(60));
  console.log('最早交易日期:', pettyCashTxns[0]?.transaction_date);
  console.log('最新交易日期:', pettyCashTxns[pettyCashTxns.length - 1]?.transaction_date);
  console.log('總筆數:', pettyCashTxns.length);
  
  let totalIn = 0;
  let totalOut = 0;
  
  pettyCashTxns.forEach(t => {
    const isPettyCashReplenishment = t.expense_category === 'Petty Cash';
    if (isPettyCashReplenishment) {
      totalIn += t.expense_amount || 0;
    } else {
      totalIn += t.income_amount || 0;
      totalOut += t.expense_amount || 0;
    }
  });
  
  const currentBalance = totalIn - totalOut;
  const targetBalance = 2284.93;
  const adjustment = targetBalance - currentBalance;
  
  console.log('─'.repeat(60));
  console.log('總補充:', totalIn.toFixed(2));
  console.log('總支出:', totalOut.toFixed(2));
  console.log('目前餘額:', currentBalance.toFixed(2));
  console.log('目標餘額:', targetBalance.toFixed(2));
  console.log('需要調整:', adjustment.toFixed(2));
  console.log('─'.repeat(60));
  console.log('建議：在最早交易日期之前加入一筆「期初結轉」');
  
  // Find earliest date
  const earliestDate = pettyCashTxns[0]?.transaction_date;
  if (earliestDate) {
    const d = new Date(earliestDate);
    d.setDate(d.getDate() - 1);
    const adjustmentDate = d.toISOString().split('T')[0];
    console.log('調整交易日期:', adjustmentDate);
    console.log('調整金額:', adjustment.toFixed(2));
  }
}

checkAll();
