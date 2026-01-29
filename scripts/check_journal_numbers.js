const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  // 分頁取得所有單號
  let all = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data } = await supabase
      .from('financial_transactions')
      .select('journal_number')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (!data || data.length === 0) break;
    all = all.concat(data);
    page++;
  }
  
  console.log('總記錄數:', all.length);
  
  // 檢查是否有非8位數字的單號
  const nonStandard = all.filter(r => {
    const jn = r.journal_number;
    if (!jn) return true;
    return jn.length !== 8 || !/^\d{8}$/.test(jn);
  });
  
  console.log('非標準格式單號數量:', nonStandard.length);
  if (nonStandard.length > 0) {
    console.log('\n所有非標準單號:');
    nonStandard.forEach(r => console.log('  ', r.journal_number));
  }
  
  // 流水號序列
  const { data: seq } = await supabase.from('global_journal_sequence').select('*').single();
  console.log('\n流水號序列:');
  console.log('  當前: ' + seq.last_number);
  console.log('  下一筆: ' + String(seq.last_number + 1).padStart(8, '0'));
}

check();
