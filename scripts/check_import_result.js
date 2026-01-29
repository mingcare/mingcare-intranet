const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // 總數
  const { count: total } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true });
  console.log('總記錄數:', total);
  
  // EX 開頭的記錄
  const { data: exRecords, count: exCount } = await supabase
    .from('financial_transactions')
    .select('journal_number, billing_month, transaction_item')
    .like('journal_number', 'EX-%')
    .order('journal_number');
  console.log('\nEX 系列單號數量:', exRecords.length);
  console.log('\n前5筆 EX 記錄:');
  exRecords.slice(0, 5).forEach(r => console.log(`  ${r.journal_number} - ${r.billing_month} ${r.transaction_item}`));
  
  // 按年份統計
  const years = [2024, 2025, 2026];
  console.log('\n按年份統計:');
  for (const year of years) {
    const { count } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('fiscal_year', year);
    console.log(`  ${year}年: ${count} 筆`);
  }
  
  // 檢查流水號序列
  const { data: seq } = await supabase.from('global_journal_sequence').select('*').single();
  console.log('\n流水號序列 (global_journal_sequence):');
  console.log(`  last_number: ${seq.last_number}`);
  console.log(`  下一筆新賬單將是: ${String(seq.last_number + 1).padStart(8, '0')}`);
}

check();
