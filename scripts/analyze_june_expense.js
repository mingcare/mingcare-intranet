const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Get all June 2025 savings expenses
  const { data: dbExpenses } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .gt('expense_amount', 0)
    .order('transaction_date')
    .order('journal_number');

  console.log('=== DB Expenses not matching Bank Statement ===');
  console.log('Bank Expense Total: $263,543.56');
  
  let dbExpTotal = 0;
  dbExpenses.forEach(t => {
    dbExpTotal += parseFloat(t.expense_amount);
  });
  console.log('DB Expense Total:   $' + dbExpTotal.toFixed(2));
  console.log('Difference:         $' + (dbExpTotal - 263543.56).toFixed(2));

  // List expenses that might not be in bank statement
  console.log('\n--- All DB Expenses by Date ---');
  const byDate = {};
  dbExpenses.forEach(t => {
    const d = t.transaction_date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push({ journal: t.journal_number, amount: parseFloat(t.expense_amount), item: t.transaction_item, method: t.payment_method });
  });

  for (const [date, items] of Object.entries(byDate)) {
    const dayTotal = items.reduce((s, i) => s + i.amount, 0);
    console.log(`\n${date} (Total: $${dayTotal.toFixed(2)}):`);
    items.forEach(i => {
      console.log(`  ${i.journal} | -$${i.amount.toFixed(2).padStart(10)} | ${i.method?.substring(0,6) || ''} | ${(i.item || '').substring(0, 40)}`);
    });
  }

  // These are likely NOT in bank statement (payment_method = 現金 or unique items)
  console.log('\n\n=== Likely NOT in Bank Statement (現金 or unusual) ===');
  const cashOrOther = dbExpenses.filter(t => 
    t.payment_method === '現金' || 
    t.transaction_item?.includes('郵') ||
    t.transaction_item?.includes('文具') ||
    t.transaction_item?.includes('洗傷口') ||
    t.transaction_item?.includes('濕紙巾') ||
    t.transaction_item?.includes('Fax') ||
    t.transaction_item?.includes('淘寶運費')
  );
  
  let cashTotal = 0;
  cashOrOther.forEach(t => {
    cashTotal += parseFloat(t.expense_amount);
    console.log(`${t.journal_number} | ${t.transaction_date} | -$${t.expense_amount.toString().padStart(8)} | ${t.payment_method} | ${(t.transaction_item || '').substring(0, 35)}`);
  });
  console.log('Cash/Other Total: $' + cashTotal.toFixed(2));

  // Check payment methods
  console.log('\n\n=== Expense by Payment Method ===');
  const byMethod = {};
  dbExpenses.forEach(t => {
    const m = t.payment_method || 'null';
    if (!byMethod[m]) byMethod[m] = 0;
    byMethod[m] += parseFloat(t.expense_amount);
  });
  for (const [method, total] of Object.entries(byMethod)) {
    console.log(`${method}: $${total.toFixed(2)}`);
  }
})();
