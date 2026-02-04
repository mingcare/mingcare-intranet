const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Add missing income: 30-Sep OUTWARD CLEARING $8,540
// This is visible in bank statement but missing from Intranet

(async () => {
  // First check if already exists
  const { data: existing } = await supabase.from('financial_transactions')
    .select('*')
    .eq('journal_number', 'INC-SEP-001');
  
  if (existing && existing.length > 0) {
    console.log('INC-SEP-001 already exists, skipping insert');
  } else {
    // Add missing income
    const { data, error } = await supabase.from('financial_transactions')
      .insert({
        journal_number: 'INC-SEP-001',
        transaction_date: '2025-09-30',
        billing_month: '2025年9月',
        transaction_item: '9月份服務費用 (OUTWARD CLEARING)',
        payment_method: '銀行轉賬',
        income_amount: 8540,
        income_category: '護理服務費用',
        expense_amount: 0,
        notes: 'Bank statement: OUTWARD CLEARING 30-Sep-25',
        fiscal_year: 2025,
        deduct_from_petty_cash: false
      })
      .select();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log('✅ Added INC-SEP-001: $' + data[0].income_amount);
  }
  
  // Verify September 2025 Savings
  const { data: savings } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '銀行轉賬')
    .eq('deduct_from_petty_cash', false);
  
  let totalInc = 0, totalExp = 0;
  savings.forEach(t => {
    totalInc += t.income_amount || 0;
    totalExp += t.expense_amount || 0;
  });
  
  const opening = 114671.46;
  const closing = opening + totalInc - totalExp;
  
  console.log('\n=== September 2025 儲蓄戶口 ===');
  console.log('Opening:', opening);
  console.log('Income:', totalInc);
  console.log('Expense:', totalExp);
  console.log('Intranet Closing:', closing.toFixed(2));
  console.log('Bank Closing: 180,669.99');
  console.log('Difference:', (180669.99 - closing).toFixed(2));
  
  if (Math.abs(180669.99 - closing) < 0.01) {
    console.log('\n✅ 儲蓄戶口 MATCH!');
  }
  
  // Also verify Current account
  const { data: current } = await supabase.from('financial_transactions')
    .select('income_amount, expense_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '支票')
    .neq('expense_category', '內部轉帳');  // Exclude internal transfer out
  
  // Plus internal transfer IN
  const { data: itIn } = await supabase.from('financial_transactions')
    .select('income_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '支票')
    .eq('income_category', '內部轉帳');
  
  // Plus internal transfer OUT (reverse)
  const { data: itOut } = await supabase.from('financial_transactions')
    .select('expense_amount')
    .gte('transaction_date', '2025-09-01')
    .lte('transaction_date', '2025-09-30')
    .eq('payment_method', '支票')
    .eq('expense_category', '內部轉帳');
  
  let currInc = 0, currExp = 0;
  current.forEach(t => {
    currInc += t.income_amount || 0;
    currExp += t.expense_amount || 0;
  });
  itIn.forEach(t => { currInc += t.income_amount || 0; });
  itOut.forEach(t => { currExp += t.expense_amount || 0; });
  
  const currOpening = 652.04;
  const currClosing = currOpening + currInc - currExp;
  
  console.log('\n=== September 2025 支票戶口 ===');
  console.log('Opening:', currOpening);
  console.log('Income:', currInc);
  console.log('Expense:', currExp);
  console.log('Intranet Closing:', currClosing.toFixed(2));
  console.log('Bank Closing: 1,492.04');
  console.log('Difference:', (1492.04 - currClosing).toFixed(2));
  
  if (Math.abs(1492.04 - currClosing) < 0.01) {
    console.log('\n✅ 支票戶口 MATCH!');
  }
})();
