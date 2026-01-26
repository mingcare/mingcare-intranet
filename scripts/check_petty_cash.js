const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // Get all 2026 January cash transactions
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Filter petty cash transactions (cash + Petty Cash category)
  const pettyCashTxns = data.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );
  
  console.log('2026年1月零用金交易:');
  console.log('─'.repeat(80));
  
  let balance = 0;
  pettyCashTxns.forEach(t => {
    const isPettyCashReplenishment = t.expense_category === 'Petty Cash';
    let inAmount = 0;
    let outAmount = 0;
    
    if (isPettyCashReplenishment) {
      inAmount = t.expense_amount || 0;
    } else {
      inAmount = t.income_amount || 0;
      outAmount = t.expense_amount || 0;
    }
    
    balance += inAmount - outAmount;
    
    console.log(`${t.transaction_date} | ${t.journal_number} | ${t.transaction_item.substring(0,30).padEnd(30)} | 補充: ${inAmount.toFixed(2).padStart(10)} | 支出: ${outAmount.toFixed(2).padStart(10)} | 餘額: ${balance.toFixed(2).padStart(10)}`);
  });
  
  console.log('─'.repeat(80));
  console.log('1月份零用金總筆數:', pettyCashTxns.length);
  console.log('1月份目前餘額: HK$' + balance.toFixed(2));
  console.log('目標餘額: HK$2,284.93');
  console.log('需要調整: HK$' + (2284.93 - balance).toFixed(2));
}

check();
