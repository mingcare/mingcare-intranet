const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// Bank Statement Data
const bankData = {
  savings: {
    '2025-04': { opening: 82755.59, expense: 161693.24, income: 182468.61, closing: 103530.96 },
    '2025-05': { opening: 103530.96, expense: 268524.00, income: 206071.57, closing: 41078.53 },
    '2025-06': { opening: 41078.53, expense: 263543.56, income: 293280.24, closing: 70815.21 },
    '2025-07': { opening: 70815.21, expense: 214247.27, income: 275653.83, closing: 132221.77 },
    '2025-08': { opening: 132221.77, expense: 240062.67, income: 222512.36, closing: 114671.46 },
    '2025-09': { opening: 114671.46, expense: 354900.00, income: 420898.53, closing: 180669.99 },
    '2025-10': { opening: 180669.99, expense: 450940.27, income: 313467.79, closing: 43197.51 },
    '2025-11': { opening: 43197.51, expense: 413974.21, income: 385700.29, closing: 14923.59 },
    '2025-12': { opening: 14923.59, expense: 353572.20, income: 500252.68, closing: 161604.07 },
  },
  current: {
    '2025-04': { opening: 1086.54, expense: 11516.00, income: 13470.00, closing: 3040.54 },
    '2025-05': { opening: 3040.54, expense: 20785.00, income: 21165.00, closing: 3420.54 },
    '2025-06': { opening: 3420.54, expense: 70733.50, income: 72500.00, closing: 5187.04 },
    '2025-07': { opening: 5187.04, expense: 9295.00, income: 22255.00, closing: 18147.04 },
    '2025-08': { opening: 18147.04, expense: 25985.00, income: 8490.00, closing: 652.04 },
    '2025-09': { opening: 652.04, expense: 60760.00, income: 61600.00, closing: 1492.04 },
    '2025-10': { opening: 1492.04, expense: 72840.00, income: 74680.00, closing: 3332.04 },
    '2025-11': { opening: 3332.04, expense: 60613.00, income: 78268.00, closing: 20987.04 },
    '2025-12': { opening: 20987.04, expense: 87679.00, income: 68449.00, closing: 1757.04 },
  }
};

async function compare() {
  console.log('=== Bank Statement vs Database Comparison ===\n');
  
  // Get all transactions from April 2025 onwards
  const { data: transactions } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
  
  console.log('=== SAVINGS ACCOUNT ===\n');
  console.log('Month     | Bank Closing | DB Closing   | Diff');
  console.log('----------|--------------|--------------|--------');
  
  for (const month of months) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const endDate = new Date(parseInt(year), parseInt(mon), 0).toISOString().split('T')[0];
    
    // Savings = deduct_from_petty_cash = true AND payment_method != '支票'
    const monthTxns = transactions.filter(t => {
      const txnDate = t.transaction_date;
      return txnDate >= startDate && txnDate <= endDate &&
             t.deduct_from_petty_cash === true &&
             t.payment_method !== '支票';
    });
    
    let income = 0, expense = 0;
    monthTxns.forEach(t => {
      income += parseFloat(t.income_amount || 0);
      expense += parseFloat(t.expense_amount || 0);
    });
    
    const bankInfo = bankData.savings[month];
    const dbClosing = bankInfo.opening + income - expense;
    const diff = bankInfo.closing - dbClosing;
    const status = Math.abs(diff) < 1 ? '✅' : '❌';
    
    console.log(`${month}   | $${bankInfo.closing.toFixed(2).padStart(10)} | $${dbClosing.toFixed(2).padStart(10)} | $${diff.toFixed(2).padStart(8)} ${status}`);
  }
  
  console.log('\n=== CURRENT (CHEQUE) ACCOUNT ===\n');
  console.log('Month     | Bank Closing | DB Closing   | Diff');
  console.log('----------|--------------|--------------|--------');
  
  for (const month of months) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const endDate = new Date(parseInt(year), parseInt(mon), 0).toISOString().split('T')[0];
    
    // Current = payment_method = '支票' OR income_category = '內部轉帳'
    const monthTxns = transactions.filter(t => {
      const txnDate = t.transaction_date;
      return txnDate >= startDate && txnDate <= endDate &&
             (t.payment_method === '支票' || 
              (t.income_category === '內部轉帳' && t.payment_method !== '銀行轉賬'));
    });
    
    let income = 0, expense = 0;
    monthTxns.forEach(t => {
      income += parseFloat(t.income_amount || 0);
      expense += parseFloat(t.expense_amount || 0);
    });
    
    const bankInfo = bankData.current[month];
    const dbClosing = bankInfo.opening + income - expense;
    const diff = bankInfo.closing - dbClosing;
    const status = Math.abs(diff) < 1 ? '✅' : '❌';
    
    console.log(`${month}   | $${bankInfo.closing.toFixed(2).padStart(10)} | $${dbClosing.toFixed(2).padStart(10)} | $${diff.toFixed(2).padStart(8)} ${status}`);
  }
}

compare().catch(console.error);
