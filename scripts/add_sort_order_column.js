const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  // 添加 sort_order 欄位
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE financial_transactions 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
      
      CREATE INDEX IF NOT EXISTS idx_ft_sort_order ON financial_transactions(transaction_date, sort_order);
    `
  });

  if (error) {
    console.log('Using direct SQL approach...');
    // 如果 RPC 不行，試試直接用 REST API
    const response = await fetch('https://cvkxlvdicympakfecgvv.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
      },
      body: JSON.stringify({
        sql: "ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0"
      })
    });
    console.log('Response:', await response.text());
  } else {
    console.log('Column added successfully');
  }

  // 檢查欄位是否存在
  const { data: sample } = await supabase
    .from('financial_transactions')
    .select('id, sort_order')
    .limit(1);
  
  console.log('Sample record:', sample);

  process.exit(0);
})();
