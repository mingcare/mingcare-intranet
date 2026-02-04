const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function fix() {
  console.log('=== Fix FPS Fee on 27/06 ===');
  console.log('Bank shows $5, DB has $10');
  
  // Fix 00001850: Bank shows $5 on 27/06, not $10
  const { error } = await supabase.from('financial_transactions')
    .update({
      expense_amount: 5,
      transaction_item: 'FPS 轉帳手續費 (FPS Fee x1 (Kyocera))',
      updated_at: new Date().toISOString()
    })
    .eq('journal_number', '00001850');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('✓ Fixed 00001850: $10 -> $5');
  
  // Verify FPS fees
  const { data: fees } = await supabase.from('financial_transactions')
    .select('expense_amount')
    .ilike('transaction_item', '%FPS%手續費%')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false);
  
  const totalFees = fees.reduce((sum, t) => sum + parseFloat(t.expense_amount || 0), 0);
  console.log('\nFPS Fee Total: $' + totalFees.toFixed(2));
  console.log('Bank FPS Total: $155.00');
  
  // Verify closing balance
  const { data } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票');
  
  let income = 0, expense = 0;
  data.forEach(t => {
    income += parseFloat(t.income_amount || 0);
    expense += parseFloat(t.expense_amount || 0);
  });
  
  const opening = 41078.53;
  const closing = opening + income - expense;
  
  console.log('\n--- June 2025 Savings Final ---');
  console.log('Opening: $' + opening.toFixed(2));
  console.log('Income:  +$' + income.toFixed(2));
  console.log('Expense: -$' + expense.toFixed(2));
  console.log('Closing: $' + closing.toFixed(2));
  console.log('Expected: $70,815.21');
  console.log('Diff: $' + Math.abs(closing - 70815.21).toFixed(2));
  
  if (Math.abs(closing - 70815.21) < 0.01) {
    console.log('\n✅ PERFECT MATCH!');
  }
}

fix().catch(console.error);
