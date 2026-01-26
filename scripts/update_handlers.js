const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function updateHandlers() {
  // Delete existing handlers
  await supabase.from('accounting_handlers').delete().neq('id', 0);
  
  // Insert new handlers
  const { data, error } = await supabase
    .from('accounting_handlers')
    .insert([
      { name: 'Candy Ho', is_active: true, sort_order: 1 },
      { name: 'Kanas Leung', is_active: true, sort_order: 2 },
      { name: 'Joe Cheung', is_active: true, sort_order: 3 }
    ])
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Updated handlers:');
  data.forEach(h => console.log('  ' + h.id + '. ' + h.name));
}

updateHandlers();
