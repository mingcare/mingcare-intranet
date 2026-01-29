const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 查找所有調整記錄
  const { data: adjustments } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('income_category.eq.期初調整,expense_category.eq.期初調整,journal_number.like.ADJ%,transaction_item.ilike.%調整%');

  console.log('所有調整相關記錄:');
  if (adjustments) {
    adjustments.forEach(a => {
      console.log(`${a.journal_number} | ${a.transaction_date} | ${a.transaction_item} | 收入: ${a.income_amount} | 支出: ${a.expense_amount} | income_cat: ${a.income_category} | expense_cat: ${a.expense_category}`);
    });
  }

  process.exit(0);
})();
