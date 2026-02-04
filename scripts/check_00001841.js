const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

(async () => {
  console.log('Checking ALL records with journal number 00001841...\n');
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, journal_number, transaction_date, transaction_item, income_amount, expense_amount, billing_month')
    .eq('journal_number', '00001841');
  
  if (error) { console.error(error); return; }
  
  console.log('Found', data.length, 'records with journal_number 00001841:\n');
  data.forEach(t => {
    console.log('ID:', t.id);
    console.log('Date:', t.transaction_date);
    console.log('Month:', t.billing_month);
    console.log('Item:', t.transaction_item);
    console.log('Income:', t.income_amount, '| Expense:', t.expense_amount);
    console.log('---');
  });
  
  // Find the one to delete (June 2025 only)
  const junRecord = data.find(t => t.transaction_date >= '2025-06-01' && t.transaction_date <= '2025-06-30');
  const janRecord = data.find(t => t.transaction_date >= '2026-01-01' && t.transaction_date <= '2026-01-31');
  
  console.log('\n📋 Summary:');
  if (junRecord) {
    console.log('✅ June 2025 duplicate (TO DELETE):', junRecord.id, '|', junRecord.transaction_item);
  }
  if (janRecord) {
    console.log('🔒 Jan 2026 record (KEEP):', janRecord.id, '|', janRecord.transaction_item, '| $' + janRecord.expense_amount);
  }
})();
