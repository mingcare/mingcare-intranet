const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Check large expenses
  const { data } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, income_amount, expense_amount, transaction_item, expense_category')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .gt('expense_amount', 5000)
    .order('expense_amount', { ascending: false });

  console.log('Large expenses (>5000) in June 2025:');
  let total = 0;
  data.forEach(t => {
    total += parseFloat(t.expense_amount);
    console.log(`${t.journal_number} | ${t.transaction_date} | -$${t.expense_amount.toString().padStart(8)} | ${(t.expense_category || '').substring(0,12).padEnd(12)} | ${(t.transaction_item || '').substring(0,35)}`);
  });
  console.log('\nTotal large expenses: $' + total.toFixed(2));

  // Bank statement large expenses for comparison
  console.log('\n--- Bank Statement Large Expenses (>5000) ---');
  const bankLarge = [
    { date: '06-06', amount: 21500, desc: 'Internal Transfer to Current' },
    { date: '06-06', amount: 18400, desc: 'Ng Kiu Ching 工資' },
    { date: '06-06', amount: 9300, desc: 'Yu Chui Ying Ken 工資' },
    { date: '06-06', amount: 6000, desc: 'Leung Hui Fung 工資' },
    { date: '06-06', amount: 5650, desc: 'Suen Ming Kuen 工資' },
    { date: '06-06', amount: 5160, desc: 'Chu Tung Ping 工資' },
    { date: '06-11', amount: 30000, desc: 'Kwok Wing Yan (Steven)' },
    { date: '06-11', amount: 1000, desc: 'Internal Transfer to Current' },
    { date: '06-12', amount: 5700, desc: 'Manulife MPF' },
    { date: '06-17', amount: 5000, desc: 'Ho Ka Fung Candy' },
    { date: '06-22', amount: 19000, desc: 'Leung Pui Man Kanas' },
    { date: '06-23', amount: 5000, desc: 'Ho Ka Fung Candy' },
    { date: '06-27', amount: 11800, desc: 'Ruby Investment (租金)' },
    { date: '06-27', amount: 50000, desc: 'Internal Transfer to Current' },
    { date: '06-30', amount: 16150, desc: 'Ho Ka Fung Candy' },
    { date: '06-30', amount: 23750, desc: 'Cheung Kwun Ho' },
  ];
  let bankTotal = 0;
  bankLarge.forEach(b => {
    bankTotal += b.amount;
    console.log(`${b.date} | -$${b.amount.toString().padStart(8)} | ${b.desc}`);
  });
  console.log('\nBank total large expenses: $' + bankTotal.toFixed(2));
})();
