const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // Add FPS fee $5 to Current account
  const { data, error } = await supabase.from('financial_transactions')
    .insert({
      journal_number: 'FEE-NOV-001',
      transaction_date: '2025-11-20',
      billing_month: '2025年11月',
      transaction_item: 'FPS 手續費',
      payment_method: '支票',
      expense_amount: 5,
      expense_category: '銀行手續費',
      income_amount: 0,
      notes: 'FPS FEE',
      fiscal_year: 2025,
      deduct_from_petty_cash: false
    })
    .select();
  
  if (error) console.error(error);
  else console.log('✅ Added FPS fee:', data);
  
  // Verify Current account
  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .eq('payment_method', '支票')
    .gte('transaction_date', '2025-11-01')
    .lte('transaction_date', '2025-11-30');
  
  let inc = 0, exp = 0;
  txns.forEach(t => { inc += t.income_amount || 0; exp += t.expense_amount || 0; });
  const closing = 3332.04 + inc - exp;
  
  console.log('\n📝 支票戶口:');
  console.log('  Income:', inc, '(Bank: 78,268)');
  console.log('  Expense:', exp, '(Bank: 60,613)');
  console.log('  Closing:', closing.toFixed(2), '(Bank: 20,987.04)');
  console.log('  Match:', Math.abs(closing - 20987.04) < 1 ? '✅' : '❌');
})();
