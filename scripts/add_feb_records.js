const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  const records = [
    // Income
    {
      transaction_date: '2026-02-03',
      transaction_item: 'MC-CCSV05/06 何活1月份加時費用',
      income_amount: 1650,
      income_category: '服務收入',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年2月'
    },
    {
      transaction_date: '2026-02-03',
      transaction_item: 'MC92/02 溫麗璋3/2 上門護理服務共4.5小時',
      income_amount: 810,
      income_category: '服務收入',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年2月'
    },
    // Expense
    {
      transaction_date: '2026-02-02',
      transaction_item: '2月份FPS手續費 (4筆 x $5)',
      expense_amount: 20,
      expense_category: '銀行手續費',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年2月'
    },
    {
      transaction_date: '2026-02-04',
      transaction_item: '1月份強積金',
      expense_amount: 7700,
      expense_category: '強積金',
      payment_method: '銀行轉賬',
      deduct_from_petty_cash: false,
      fiscal_year: 2026,
      billing_month: '2026年2月'
    }
  ];

  const { data, error } = await supabase.from('financial_transactions').insert(records).select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Added', data.length, 'records:');
    data.forEach(r => console.log('-', r.transaction_date, r.income_amount || r.expense_amount, r.transaction_item));
  }

  // Calculate totals
  console.log('\n=== Feb 2026 (1-4) Summary ===');
  const { data: allFeb } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2026-02-01')
    .lte('transaction_date', '2026-02-04')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false);
  
  const income = allFeb?.filter(t => t.income_amount > 0).reduce((s, t) => s + t.income_amount, 0) || 0;
  const expense = allFeb?.filter(t => t.expense_amount > 0).reduce((s, t) => s + t.expense_amount, 0) || 0;
  
  console.log('Opening: $537,961.08');
  console.log('+ Income: $' + income.toFixed(2), '(Bank: $3,300)');
  console.log('- Expense: $' + expense.toFixed(2), '(Bank: $69,170)');
  console.log('= Closing: $' + (537961.08 + income - expense).toFixed(2), '(Bank: $472,091.08)');
})();
