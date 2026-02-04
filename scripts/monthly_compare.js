const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

// 已確認的銀行帳單數據
const bankData = {
  '2025-04': { opening: 82755.59, income: 182468.61, expense: 161693.24, closing: 103530.96 },
  '2025-05': { opening: 103530.96, income: 110451.90, expense: 149398.57, closing: 64584.29 },
  '2025-06': { opening: 64584.29, income: 107710.30, expense: 103605.07, closing: 68689.52 },
  '2025-07': { opening: 68689.52, income: 79108.75, expense: 99139.80, closing: 48658.47 },
  '2025-08': { opening: 48658.47, income: 94259.70, expense: 98832.25, closing: 44085.92 },
  '2025-09': { opening: 44085.92, income: 90700.30, expense: 100682.63, closing: 34103.59 },
  '2025-10': { opening: 34103.59, income: 102139.30, expense: 104538.65, closing: 31704.24 },
  '2025-11': { opening: 31704.24, income: 230102.09, expense: 114882.75, closing: 146923.58 },
  '2025-12': { opening: 146923.58, income: 368328.69, expense: 353648.20, closing: 161604.07 },
  '2026-01': { opening: 161604.07, income: 776562.18, expense: 400205.17, closing: 537961.08 }
};

(async () => {
  // 計算每個月份的 Intranet 數據
  const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];
  
  console.log('=== 逐月對比: 銀行 vs Intranet ===\n');
  console.log('月份       |   銀行收入   |  Intranet收入  |  差異  |   銀行支出   |  Intranet支出  |  差異');
  console.log('-'.repeat(100));
  
  let cumulativeIncome = 0, cumulativeExpense = 0;
  
  for (const month of months) {
    const [year, m] = month.split('-');
    const startDate = `${year}-${m}-01`;
    const endDate = `${year}-${m}-${m === '02' ? '28' : ['04', '06', '09', '11'].includes(m) ? '30' : '31'}`;
    
    const { data } = await supabase.from('financial_transactions')
      .select('income_amount, expense_amount, payment_method, deduct_from_petty_cash')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('is_deleted', false);
    
    let income = 0, expense = 0;
    data?.forEach(t => {
      const isPetty = t.deduct_from_petty_cash === true;
      const isBankOrCheque = t.payment_method === '銀行轉賬' || t.payment_method === '支票';
      const isBank = t.payment_method === '銀行轉賬';
      
      if (isBankOrCheque && !isPetty && t.income_amount > 0) income += t.income_amount;
      if (isBank && !isPetty && t.expense_amount > 0) expense += t.expense_amount;
    });
    
    cumulativeIncome += income;
    cumulativeExpense += expense;
    
    const bank = bankData[month];
    const incomeDiff = income - bank.income;
    const expenseDiff = expense - bank.expense;
    
    const incomeMatch = Math.abs(incomeDiff) < 0.01 ? '✅' : '❌';
    const expenseMatch = Math.abs(expenseDiff) < 0.01 ? '✅' : '❌';
    
    console.log(`${month}     | $${bank.income.toFixed(2).padStart(10)} | $${income.toFixed(2).padStart(12)} | ${incomeMatch} ${incomeDiff.toFixed(2).padStart(8)} | $${bank.expense.toFixed(2).padStart(10)} | $${expense.toFixed(2).padStart(12)} | ${expenseMatch} ${expenseDiff.toFixed(2).padStart(8)}`);
  }
  
  console.log('\n=== 累計總結 ===');
  console.log('Intranet 累計收入: $' + cumulativeIncome.toFixed(2));
  console.log('Intranet 累計支出: $' + cumulativeExpense.toFixed(2));
  console.log('Intranet 計算餘額: $' + (82755.59 + cumulativeIncome - cumulativeExpense).toFixed(2));
  console.log('銀行 2026-01 Closing: $537,961.08');
  
  process.exit(0);
})();
