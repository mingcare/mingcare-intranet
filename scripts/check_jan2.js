const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // 查看2025年1月2日的交易
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('transaction_date', '2025-01-02')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('journal_number', { ascending: true })

  console.log('2025-01-02 所有交易:');
  data.forEach(t => {
    console.log(t.journal_number, '|', t.transaction_item, '| Method:', t.payment_method, '| In:', t.income_amount || 0, '| Out:', t.expense_amount || 0);
  });

  // 計算到1月2日為止的零用金餘額
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .lte('transaction_date', '2025-01-02')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })

  let balance = 0;
  allData.forEach(t => {
    const isPettyCash = (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) || t.expense_category === 'Petty Cash';
    const isAdj = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'));
    
    if (isPettyCash) {
      if (t.expense_category === 'Petty Cash') {
        balance += (t.expense_amount || 0);
      } else if (isAdj) {
        balance += (t.income_amount || 0);
      } else {
        balance += (t.income_amount || 0) - (t.expense_amount || 0);
      }
    }
  });

  console.log('\n到2025-01-02為止的零用金餘額:', balance.toFixed(2));
  console.log('目標餘額: 1698');
  console.log('需要調整:', (1698 - balance).toFixed(2));
}

check();
