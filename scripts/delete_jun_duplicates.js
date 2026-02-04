const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I');

// These are the duplicate records that were added but EX-0032 and EX-0033 already existed
const DUPLICATE_JOURNALS = [
  '00001841', // 6月份儲蓄戶口利息 $5.24 (duplicate of EX-0033)
  '00001842', // FPS 轉帳手續費 $10
  '00001843', // FPS 轉帳手續費 $95
  '00001844', // FPS 轉帳手續費 $5
  '00001845', // FPS 轉帳手續費 $5
  '00001846', // FPS 轉帳手續費 $5
  '00001847', // FPS 轉帳手續費 $5
  '00001848', // FPS 轉帳手續費 $5
  '00001849', // FPS 轉帳手續費 $5
  '00001850', // FPS 轉帳手續費 $5
  '00001851', // FPS 轉帳手續費 $15
];
// Total FPS fees: 10+95+5+5+5+5+5+5+5+15 = $155 (matches EX-0032)

(async () => {
  console.log('Checking duplicate records to delete...\n');
  
  // First, show what will be deleted - only June 2025 records
  const { data: toDelete, error: fetchError } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount')
    .in('journal_number', DUPLICATE_JOURNALS)
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .order('journal_number');
  
  if (fetchError) {
    console.error('Error fetching:', fetchError);
    return;
  }
  
  console.log('Records to delete (duplicates of EX-0032 and EX-0033):');
  console.log('='.repeat(80));
  
  let totalInc = 0, totalExp = 0;
  toDelete.forEach(t => {
    console.log(`${t.journal_number} | ${t.transaction_date} | ${t.transaction_item?.substring(0,40)} | +$${t.income_amount || 0} -$${t.expense_amount || 0}`);
    totalInc += t.income_amount || 0;
    totalExp += t.expense_amount || 0;
  });
  
  console.log('='.repeat(80));
  console.log(`Total duplicate Income: $${totalInc.toFixed(2)}`);
  console.log(`Total duplicate Expense: $${totalExp.toFixed(2)}`);
  console.log(`Net effect on closing: $${(totalInc - totalExp).toFixed(2)}`);
  console.log(`\nExpected closing correction: +$149.76 (to match bank)`);
  
  console.log('\n⚠️  To delete these records, run with --delete flag');
  
  if (process.argv.includes('--delete')) {
    console.log('\n🗑️  Deleting duplicate records...');
    
    // Get the IDs of June 2025 duplicates to delete
    const { data: toDeleteIds } = await supabase
      .from('financial_transactions')
      .select('id')
      .in('journal_number', DUPLICATE_JOURNALS)
      .gte('transaction_date', '2025-06-01')
      .lte('transaction_date', '2025-06-30');
    
    const ids = toDeleteIds.map(r => r.id);
    
    const { error: deleteError } = await supabase
      .from('financial_transactions')
      .delete()
      .in('id', ids);
    
    if (deleteError) {
      console.error('Error deleting:', deleteError);
      return;
    }
    
    console.log('✅ Deleted', ids.length, 'duplicate records');
  }
})();
