const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Fix duplicate $8,540 record
// - INC-SEP-001: my added record (should delete)
// - 00001326: original record (should move to Sep 30)

(async () => {
  console.log('=== Fixing Duplicate $8,540 Record ===\n');
  
  // Delete INC-SEP-001 (duplicate)
  const { error: e1 } = await supabase.from('financial_transactions')
    .delete()
    .eq('journal_number', 'INC-SEP-001');
  
  if (e1) { console.error('Delete error:', e1); return; }
  console.log('✅ Deleted INC-SEP-001');
  
  // Update 00001326 to Sep 30
  const { error: e2 } = await supabase.from('financial_transactions')
    .update({ 
      transaction_date: '2025-09-30',
      billing_month: '2025年9月',
      notes: 'OUTWARD CLEARING - Bank入賬 30-Sep'
    })
    .eq('journal_number', '00001326');
  
  if (e2) { console.error('Update error:', e2); return; }
  console.log('✅ Updated 00001326: moved to 2025-09-30');
  
  // Verify September
  console.log('\n=== Verifying September 2025 ===');
  const { data: sepTxns } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false);
  
  let sepInc = 0, sepExp = 0;
  sepTxns.forEach(t => {
    sepInc += t.income_amount || 0;
    sepExp += t.expense_amount || 0;
  });
  
  const sepOpening = 114671.46;
  const sepClosing = sepOpening + sepInc - sepExp;
  console.log('Intranet Closing:', sepClosing.toFixed(2));
  console.log('Bank Closing: 180,669.99');
  console.log('Diff:', (180669.99 - sepClosing).toFixed(2));
  
  // Verify October
  console.log('\n=== Verifying October 2025 ===');
  const { data: octTxns } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-10-01')
    .lte('transaction_date', '2025-10-31')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false);
  
  let octInc = 0, octExp = 0;
  octTxns.forEach(t => {
    octInc += t.income_amount || 0;
    octExp += t.expense_amount || 0;
  });
  
  const octOpening = 180669.99;
  const octClosing = octOpening + octInc - octExp;
  console.log('Intranet Closing:', octClosing.toFixed(2));
  console.log('Bank Closing: 43,197.51');
  console.log('Diff:', (43197.51 - octClosing).toFixed(2));
})();
