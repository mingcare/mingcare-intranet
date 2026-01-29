const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取當前 00001802 的 income_amount
  const { data: adj } = await supabase
    .from('financial_transactions')
    .select('income_amount')
    .eq('journal_number', '00001802')
    .single();

  console.log('當前 00001802 income_amount:', adj?.income_amount);

  // Intranet 顯示 667 餘額是 13314.07，但應該是 1802.49
  // 差了 13314.07 - 1802.49 = 11511.58
  // 所以需要減少調整金額 11511.58

  const currentAdjustment = adj?.income_amount || 0;
  const difference = 13314.07 - 1802.49; // 11511.58
  const newAdjustment = currentAdjustment - difference;

  console.log('需要減少:', difference.toFixed(2));
  console.log('新調整金額:', newAdjustment.toFixed(2));

  // 更新
  const { error } = await supabase
    .from('financial_transactions')
    .update({ income_amount: newAdjustment })
    .eq('journal_number', '00001802');

  if (error) {
    console.error('更新失敗:', error);
  } else {
    console.log('\n✅ 已更新 00001802 income_amount 為:', newAdjustment.toFixed(2));
  }

  process.exit(0);
})();
