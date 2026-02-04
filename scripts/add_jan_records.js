const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  const records = [
    {
      transaction_date: '2026-01-07',
      transaction_item: 'Candy 12月份工資 (Cash)',
      expense_amount: 43375,
      expense_category: '工資支出',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: true,
      fiscal_year: 2026,
      billing_month: '2026年1月'
    },
    {
      transaction_date: '2026-01-31',
      transaction_item: '1月份FPS手續費 (42筆 x $5)',
      expense_amount: 210,
      expense_category: '銀行手續費',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年1月'
    },
    {
      transaction_date: '2026-01-31',
      transaction_item: '1月份儲蓄戶口利息',
      income_amount: 0.18,
      income_category: '利息收入',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年1月'
    }
  ];

  const { data, error } = await supabase.from('financial_transactions').insert(records).select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Added', data.length, 'records:');
    data.forEach(r => console.log('-', r.transaction_item, r.income_amount || r.expense_amount));
  }
})();
