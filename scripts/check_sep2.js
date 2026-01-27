const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // 找到 journal_number 1203 的交易
  const { data: txn1203 } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00001203')
    .single();

  console.log('Journal 1203:', txn1203 ? txn1203.transaction_item : 'Not found');
  console.log('Date:', txn1203 ? txn1203.transaction_date : '');

  // 計算到該筆交易為止的零用金餘額
  const { data: allData } = await supabase
    .from('financial_transactions')
    .select('*')
    .lte('transaction_date', '2025-09-02')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true });

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

  console.log('\n到2025-09-02為止的零用金餘額:', balance.toFixed(2));
  console.log('目標餘額: 730.82');
  console.log('需要調整:', (730.82 - balance).toFixed(2));

  // 查看現有調整記錄
  const { data: adjData } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('id', '5407ca28-c8c9-4fee-ae03-7d70151f12e3');
  
  console.log('\n現有調整記錄金額:', adjData[0].income_amount);
  console.log('新調整金額應為:', adjData[0].income_amount + (730.82 - balance));
}

check();
