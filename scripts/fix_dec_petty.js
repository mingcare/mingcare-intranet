const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function addMissingRecords() {
  // 缺失的兩筆記錄
  const missing = [
    {
      journal_number: '1672',
      transaction_date: '2025-12-23',
      billing_month: '2025-12',
      transaction_item: '補郵費',
      expense_category: '辦公費用',
      expense_amount: 6.40,
      income_amount: 0,
      payment_method: '現金',
      deduct_from_petty_cash: true
    },
    {
      journal_number: '1673',
      transaction_date: '2025-12-23',
      billing_month: '2025-12',
      transaction_item: '郵費',
      expense_category: '辦公費用',
      expense_amount: 6.60,
      income_amount: 0,
      payment_method: '現金',
      deduct_from_petty_cash: true
    }
  ];

  // 檢查是否已存在
  for (const record of missing) {
    const { data: existing } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('journal_number', record.journal_number)
      .single();

    if (existing) {
      console.log(`記錄 ${record.journal_number} 已存在，跳過`);
      continue;
    }

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(record)
      .select();

    if (error) {
      console.log(`Error adding ${record.journal_number}:`, error.message);
    } else {
      console.log(`✅ 已添加記錄 ${record.journal_number}: ${record.transaction_item} HK$${record.expense_amount}`);
    }
  }

  // 驗證12月結餘
  const { data: decTxns } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-12-01')
    .lte('transaction_date', '2025-12-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true });

  const pettyCash = decTxns.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  );

  // 計算11月結餘作為12月期初
  const OPENING = 2911.27; // 11月結餘
  let balance = OPENING;
  
  pettyCash.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash';
    if (isReplenishment) {
      balance += (t.expense_amount || 0);
    } else {
      balance += (t.income_amount || 0) - (t.expense_amount || 0);
    }
  });

  console.log('\n=== 12月零用金驗證 ===');
  console.log('期初 (11月結餘):', OPENING.toFixed(2));
  console.log('12月交易筆數:', pettyCash.length);
  console.log('12月結餘:', balance.toFixed(2));
  console.log('目標結餘: 1347.00');
}

addMissingRecords();
