const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

async function analyze() {
  // April: Bank says income $182,468.61, DB (payment=銀行轉賬) says $156,548.61
  // Difference: $25,920 in both income and expense
  
  console.log('=== April 2025 Analysis ===\n');
  console.log('Bank: Income $182,468.61, Expense $161,693.24');
  console.log('DB:   Income $156,548.61, Expense $135,773.24');
  console.log('Diff: +$25,920 (both income and expense)\n');
  
  // Check what transactions add up to $25,920
  // Likely some 現金 or other payment methods that should be 銀行轉賬
  
  const { data: apr } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  // Find transactions that are NOT 銀行轉賬 but maybe should be
  const nonBank = apr.filter(t => t.payment_method !== '銀行轉賬');
  
  let nonBankInc = 0, nonBankExp = 0;
  nonBank.forEach(t => {
    nonBankInc += parseFloat(t.income_amount || 0);
    nonBankExp += parseFloat(t.expense_amount || 0);
  });
  
  console.log('Non-銀行轉賬 transactions in April:');
  console.log('  Count:', nonBank.length);
  console.log('  Income: $' + nonBankInc.toFixed(2));
  console.log('  Expense: $' + nonBankExp.toFixed(2));
  
  // Group by payment method
  const byMethod = {};
  nonBank.forEach(t => {
    const pm = t.payment_method || 'null';
    if (!byMethod[pm]) byMethod[pm] = { inc: 0, exp: 0, count: 0 };
    byMethod[pm].inc += parseFloat(t.income_amount || 0);
    byMethod[pm].exp += parseFloat(t.expense_amount || 0);
    byMethod[pm].count++;
  });
  
  console.log('\nBreakdown by payment_method:');
  Object.entries(byMethod).forEach(([pm, data]) => {
    console.log('  ' + pm + ': +$' + data.inc.toFixed(2) + ' -$' + data.exp.toFixed(2) + ' (' + data.count + ' records)');
  });
  
  // The $25,920 difference - look for transactions around that amount
  console.log('\n--- Looking for $25,920 source ---');
  
  // Check if 現金 transactions match
  const cashTxns = apr.filter(t => t.payment_method === '現金');
  let cashInc = 0, cashExp = 0;
  cashTxns.forEach(t => {
    cashInc += parseFloat(t.income_amount || 0);
    cashExp += parseFloat(t.expense_amount || 0);
  });
  console.log('現金: +$' + cashInc.toFixed(2) + ' -$' + cashExp.toFixed(2));
  
  // Check 支票
  const chequeTxns = apr.filter(t => t.payment_method === '支票');
  let chequeInc = 0, chequeExp = 0;
  chequeTxns.forEach(t => {
    chequeInc += parseFloat(t.income_amount || 0);
    chequeExp += parseFloat(t.expense_amount || 0);
  });
  console.log('支票: +$' + chequeInc.toFixed(2) + ' -$' + chequeExp.toFixed(2));
}

analyze().catch(console.error);
