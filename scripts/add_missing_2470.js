const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  console.log('=== Adding Missing Income $2,470 ===\n');

  // Missing from Bank Statement:
  // 18-Aug-25 | MS YU YUN CHI | $2,470 | FPS Deposit

  const missingRecord = {
    journal_number: 'INC-AUG-001',
    transaction_date: '2025-08-18',
    billing_month: '2025年8月',
    transaction_item: 'MC54 余小姐 護理服務費用 (from Bank Reconciliation)',
    payment_method: '銀行轉賬',
    income_amount: 2470,
    income_category: '護理服務費用',
    expense_amount: 0,
    handler: 'Joe Cheung',
    notes: 'Bank: FPS NOTPROVIDED MS YU YUN CHI 2025-08-18 - 對帳時發現遺漏',
    deduct_from_petty_cash: false,
    is_deleted: false,
    fiscal_year: 2025
  };

  // Check if exists
  const { data: existing } = await supabase.from('financial_transactions')
    .select('journal_number')
    .eq('journal_number', 'INC-AUG-001');

  if (existing && existing.length > 0) {
    console.log('⚠️ Record already exists: INC-AUG-001');
    return;
  }

  const { data, error } = await supabase.from('financial_transactions')
    .insert(missingRecord)
    .select();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('✅ Added missing income:');
  console.log('  Journal: INC-AUG-001');
  console.log('  Date: 2025-08-18');
  console.log('  Amount: $2,470');
  console.log('  Description: 余小姐 護理服務費用');

  // Verify August Savings
  console.log('\n=== Verifying August 2025 Savings ===');

  const { data: txns } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-08-01')
    .lte('transaction_date', '2025-08-31')
    .order('transaction_date');

  const savingsTxns = txns.filter(t => {
    if (t.payment_method === '銀行轉賬') return true;
    if (t.payment_method === '支票' && (t.income_amount || 0) > 0 && !(t.expense_amount > 0) && t.income_category !== '內部轉帳') return true;
    return false;
  });

  const income = savingsTxns.reduce((sum, t) => sum + (t.income_amount || 0), 0);
  const expense = savingsTxns.reduce((sum, t) => sum + (t.expense_amount || 0), 0);
  const opening = 132221.77;
  const closing = opening + income - expense;
  const bankClosing = 114671.46;

  console.log('\n🏦 儲蓄戶口:');
  console.log('  Opening: $' + opening);
  console.log('  Income: $' + income.toFixed(2));
  console.log('  Expense: $' + expense.toFixed(2));
  console.log('  Intranet Closing: $' + closing.toFixed(2));
  console.log('  Bank Closing: $' + bankClosing);
  console.log('  Difference: $' + (closing - bankClosing).toFixed(2));

  if (Math.abs(closing - bankClosing) < 1) {
    console.log('\n✅ 儲蓄戶口 MATCH (REV差異可接受)!');
  } else {
    console.log('\n❌ Still mismatch');
  }
})();
