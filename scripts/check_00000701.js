const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function main() {
  // 查詢 00000701 詳細資料
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('journal_number', '00000701')
    .single();

  if (error) { console.error(error); return; }

  console.log('00000701 詳細資料：');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
