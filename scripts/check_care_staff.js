const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function checkStructure() {
  const { data, error } = await supabase.from('care_staff_profiles').select('*').limit(1);
  if (error) { 
    console.log('Error:', error); 
    return; 
  }
  if (data && data.length > 0) {
    console.log('Current columns in care_staff_profiles:');
    Object.keys(data[0]).forEach(col => console.log('-', col));
  }
}
checkStructure();
