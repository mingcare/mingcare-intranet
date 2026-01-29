const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function addColumns() {
  // 使用 SQL 直接添加欄位
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE care_staff_profiles 
      ADD COLUMN IF NOT EXISTS profile_photo_url text,
      ADD COLUMN IF NOT EXISTS address text;
    `
  });

  if (error) {
    console.log('RPC Error (expected if function does not exist):', error.message);
    console.log('請在 Supabase Dashboard 執行以下 SQL：');
    console.log(`
ALTER TABLE care_staff_profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS address text;
    `);
  } else {
    console.log('欄位新增成功！');
  }
}

addColumns();
