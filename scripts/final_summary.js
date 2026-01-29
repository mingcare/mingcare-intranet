const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function summary() {
  console.log('========================================');
  console.log('   財務交易記錄 - 完整總結');
  console.log('========================================\n');
  
  // 總數
  const { count: total } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true });
  console.log('總記錄數:', total);
  
  // 按年份
  console.log('\n按年份統計:');
  for (const year of [2024, 2025, 2026]) {
    const { count } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('fiscal_year', year);
    console.log(`  ${year}年: ${count} 筆`);
  }
  
  // 單號類型統計
  const { data: all } = await supabase.from('financial_transactions').select('journal_number');
  
  const ex = all.filter(r => r.journal_number && r.journal_number.startsWith('EX-')).length;
  const rSeries = all.filter(r => r.journal_number && /^R\d+$/.test(r.journal_number)).length;
  const withBrackets = all.filter(r => r.journal_number && r.journal_number.includes('(')).length;
  const withLetters = all.filter(r => {
    const jn = r.journal_number;
    if (!jn) return false;
    if (jn.startsWith('EX-') || /^R\d+$/.test(jn)) return false;
    return /\d+[a-cA-C]$/.test(jn);
  }).length;
  
  console.log('\n按單號類型統計:');
  console.log(`  純數字 (00001xxx): ${total - ex - rSeries - withBrackets - withLetters} 筆`);
  console.log(`  EX 系列 (銀行利息/手續費): ${ex} 筆`);
  console.log(`  R 系列: ${rSeries} 筆`);
  console.log(`  含括號 (如 14(A), 273(a)): ${withBrackets} 筆`);
  console.log(`  含字母後綴 (如 200a, 1699A): ${withLetters} 筆`);
  
  // 列出所有非純數字單號
  const nonNumeric = all.filter(r => {
    const jn = r.journal_number;
    if (!jn) return false;
    return !/^\d{8}$/.test(jn);
  }).map(r => r.journal_number).sort();
  
  console.log('\n所有非純數字單號:');
  console.log(nonNumeric.join(', '));
  
  // 流水號
  const { data: seq } = await supabase.from('global_journal_sequence').select('*').single();
  console.log('\n流水號序列:');
  console.log(`  當前最後編號: ${seq.last_number}`);
  console.log(`  下一筆新賬單: ${String(seq.last_number + 1).padStart(8, '0')}`);
  
  console.log('\n========================================');
  console.log('所有交易已導入完成！');
  console.log('新賬單將繼續使用 00001819 格式');
  console.log('特殊單號不影響正常流水號');
  console.log('========================================');
}

summary();
