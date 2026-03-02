const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function addTracyYau() {
  console.log('=== Adding Tracy Yau to database ===\n');

  // 1. Add Tracy Yau to project_manager_enum
  console.log('1. Adding to project_manager_enum...');
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: "ALTER TYPE project_manager_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';"
  }).catch(() => ({ error: { message: 'rpc not available' } }));

  // 2. Add Tracy Yau to staff_owner_enum
  console.log('2. Adding to staff_owner_enum...');
  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: "ALTER TYPE staff_owner_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';"
  }).catch(() => ({ error: { message: 'rpc not available' } }));

  // 3. Add Tracy Yau to introducer_enum
  console.log('3. Adding to introducer_enum...');
  const { error: e3 } = await supabase.rpc('exec_sql', {
    sql: "ALTER TYPE introducer_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';"
  }).catch(() => ({ error: { message: 'rpc not available' } }));

  // 4. Add Tracy Yau to accounting_handlers table
  console.log('4. Adding to accounting_handlers table...');
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('accounting_handlers')
    .select('*')
    .eq('name', 'Tracy Yau');

  if (existing && existing.length > 0) {
    console.log('   Tracy Yau already exists in accounting_handlers');
  } else {
    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('accounting_handlers')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrder && maxOrder[0] ? maxOrder[0].sort_order : 0) + 1;

    const { data, error } = await supabase
      .from('accounting_handlers')
      .insert([{ name: 'Tracy Yau', is_active: true, sort_order: nextOrder }])
      .select();

    if (error) {
      console.error('   Error adding to accounting_handlers:', error.message);
    } else {
      console.log('   Added Tracy Yau to accounting_handlers:', data);
    }
  }

  // 5. Verify accounting_handlers
  console.log('\n5. Current accounting_handlers:');
  const { data: handlers } = await supabase
    .from('accounting_handlers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (handlers) {
    handlers.forEach(h => console.log(`   ${h.sort_order}. ${h.name}`));
  }

  console.log('\n=== Done ===');
  console.log('\nNOTE: If enum updates failed via RPC, run this SQL directly in Supabase SQL Editor:');
  console.log("  ALTER TYPE project_manager_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';");
  console.log("  ALTER TYPE staff_owner_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';");
  console.log("  ALTER TYPE introducer_enum ADD VALUE IF NOT EXISTS 'Tracy Yau';");
}

addTracyYau();
