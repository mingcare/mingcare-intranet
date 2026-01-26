const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function check() {
  const { data, error } = await supabase
    .from('accounting_handlers')
    .select('*')
    .order('sort_order');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Current handlers in database:');
  data.forEach(h => console.log('  ' + h.id + '. ' + h.name + ' (active: ' + h.is_active + ')'));
  
  const { data: usedHandlers } = await supabase
    .from('financial_transactions')
    .select('handler')
    .not('handler', 'is', null);
  
  const uniqueHandlers = [...new Set(usedHandlers.map(t => t.handler))];
  console.log('\nHandlers used in transactions:');
  uniqueHandlers.forEach(h => console.log('  - ' + h));
}

check();
