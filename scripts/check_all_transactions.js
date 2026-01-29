const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function checkAll() {
  console.log('=== 完整檢查 financial_transactions 表 ===\n');
  
  // 總數
  const { count: total } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true });
  console.log('總記錄數:', total);
  
  // 按單號類型統計
  console.log('\n--- 按單號類型統計 ---');
  
  // 純數字單號 (00000001 格式)
  const { data: numericRecords } = await supabase
    .from('financial_transactions')
    .select('journal_number')
    .like('journal_number', '0000%');
  console.log(`純數字單號 (0000xxxx): ${numericRecords.length} 筆`);
  
  // EX 開頭
  const { data: exRecords } = await supabase
    .from('financial_transactions')
    .select('journal_number')
    .like('journal_number', 'EX-%');
  console.log(`EX 系列單號: ${exRecords.length} 筆`);
  
  // R 開頭
  const { data: rRecords } = await supabase
    .from('financial_transactions')
    .select('journal_number')
    .like('journal_number', 'R%');
  console.log(`R 系列單號: ${rRecords.length} 筆`);
  
  // 特殊格式 (包含括號或字母後綴)
  const { data: allRecords } = await supabase
    .from('financial_transactions')
    .select('journal_number');
  
  const specialPatterns = allRecords.filter(r => {
    const jn = r.journal_number;
    if (!jn) return false;
    // 排除純數字和 EX- 開頭
    if (/^0000\d+$/.test(jn) || jn.startsWith('EX-') || /^R\d+$/.test(jn)) return false;
    // 匹配特殊格式
    return /\d+\([a-zA-Z]\)|\d+[a-cA-C]$|\d+[A-C]$/.test(jn);
  });
  console.log(`特殊格式單號 (如 14(A), 200a, 1699A): ${specialPatterns.length} 筆`);
  
  // 列出所有特殊格式單號
  console.log('\n--- 特殊格式單號列表 ---');
  const allSpecial = allRecords.filter(r => {
    const jn = r.journal_number;
    if (!jn) return false;
    if (/^0000\d+$/.test(jn)) return false;  // 排除純數字
    return true;
  }).map(r => r.journal_number).sort();
  
  // 分類顯示
  const exNums = allSpecial.filter(jn => jn.startsWith('EX-'));
  const rNums = allSpecial.filter(jn => /^R\d+/.test(jn));
  const otherNums = allSpecial.filter(jn => !jn.startsWith('EX-') && !/^R\d+/.test(jn));
  
  console.log(`\nR 系列 (${rNums.length}筆): ${rNums.join(', ')}`);
  console.log(`\n其他特殊單號 (${otherNums.length}筆): ${otherNums.join(', ')}`);
  
  // 按年份統計
  console.log('\n--- 按年份統計 ---');
  for (const year of [2024, 2025, 2026]) {
    const { count } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('fiscal_year', year);
    console.log(`${year}年: ${count} 筆`);
  }
  
  // 流水號序列
  const { data: seq } = await supabase.from('global_journal_sequence').select('*').single();
  console.log('\n--- 流水號序列 ---');
  console.log(`當前序列: ${seq.last_number}`);
  console.log(`下一筆新賬單: ${String(seq.last_number + 1).padStart(8, '0')}`);
  console.log('\n✅ 新賬單會繼續使用 00001819, 00001820... 格式，不受特殊單號影響');
}

checkAll();
