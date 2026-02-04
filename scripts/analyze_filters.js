const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank statement expected totals
const bankSavings = {
  '2025-04': { income: 182468.61, expense: 161693.24, closing: 103530.96 },
  '2025-05': { income: 206071.57, expense: 268524.00, closing: 41078.53 },
  '2025-06': { income: 293280.24, expense: 263543.56, closing: 70815.21 },
};

async function analyze() {
  console.log('=== Detailed Analysis: Savings Account ===\n');
  
  for (const month of ['2025-04', '2025-05', '2025-06']) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
    const endDate = `${year}-${mon}-${lastDay}`;
    
    console.log(`\n=== ${month} ===`);
    
    // Method 1: payment_method = '銀行轉賬' (all bank transfers)
    const { data: method1 } = await supabase.from('financial_transactions')
      .select('income_amount, expense_amount')
      .eq('payment_method', '銀行轉賬')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('is_deleted', false);
    
    let m1Inc = 0, m1Exp = 0;
    method1.forEach(t => {
      m1Inc += parseFloat(t.income_amount || 0);
      m1Exp += parseFloat(t.expense_amount || 0);
    });
    
    // Method 2: deduct=true AND payment != 支票
    const { data: method2 } = await supabase.from('financial_transactions')
      .select('income_amount, expense_amount')
      .eq('deduct_from_petty_cash', true)
      .neq('payment_method', '支票')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('is_deleted', false);
    
    let m2Inc = 0, m2Exp = 0;
    method2.forEach(t => {
      m2Inc += parseFloat(t.income_amount || 0);
      m2Exp += parseFloat(t.expense_amount || 0);
    });
    
    const bank = bankSavings[month];
    
    console.log('Bank Statement:');
    console.log('  Income:  $' + bank.income.toFixed(2));
    console.log('  Expense: $' + bank.expense.toFixed(2));
    
    console.log('\nMethod 1 (payment=銀行轉賬):');
    console.log('  Income:  $' + m1Inc.toFixed(2) + ' (diff: $' + (bank.income - m1Inc).toFixed(2) + ')');
    console.log('  Expense: $' + m1Exp.toFixed(2) + ' (diff: $' + (bank.expense - m1Exp).toFixed(2) + ')');
    
    console.log('\nMethod 2 (deduct=true, payment!=支票):');
    console.log('  Income:  $' + m2Inc.toFixed(2) + ' (diff: $' + (bank.income - m2Inc).toFixed(2) + ')');
    console.log('  Expense: $' + m2Exp.toFixed(2) + ' (diff: $' + (bank.expense - m2Exp).toFixed(2) + ')');
  }
}

analyze().catch(console.error);
