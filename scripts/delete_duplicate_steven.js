const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

(async () => {
  // 先查找 1 月的重複記錄 ID
  const { data: janRecord } = await supabase.from('financial_transactions')
    .select('id, journal_number, transaction_item')
    .eq('transaction_date', '2026-01-02')
    .eq('income_amount', 13620)
    .ilike('transaction_item', '%Steven%');
  
  console.log('January record to delete:', janRecord);
  
  if (janRecord && janRecord.length > 0) {
    const { error } = await supabase.from('financial_transactions')
      .delete()
      .eq('id', janRecord[0].id);
    
    if (error) console.error('Error:', error);
    else console.log('Deleted duplicate record:', janRecord[0].journal_number, '-', janRecord[0].transaction_item);
  } else {
    console.log('No record found to delete');
  }
})();
