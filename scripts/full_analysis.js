const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

// 銀行帳單確認的數據
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

async function analyzeMonth(month) {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
  const endDate = `${year}-${m}-${lastDay}`;
  
  // 獲取該月所有記錄
  const { data: allRecords } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('is_deleted', false)
    .order('transaction_date');
  
  const bank = bankData[month];
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${month} 分析`);
  console.log(`${'='.repeat(80)}`);
  console.log(`銀行: Opening $${bank.opening.toFixed(2)} | Income $${bank.income.toFixed(2)} | Expense $${bank.expense.toFixed(2)} | Closing $${bank.closing.toFixed(2)}`);
  
  // 分類統計
  const stats = {
    // 儲蓄戶口 (應計入銀行對帳)
    savingsIncome: { total: 0, records: [] },
    savingsExpense: { total: 0, records: [] },
    // 被排除的記錄 (deduct_from_petty_cash = true 或 payment_method != 銀行轉賬/支票)
    excludedIncome: { total: 0, records: [] },
    excludedExpense: { total: 0, records: [] },
    // 支票收入 (存入儲蓄)
    chequeIncome: { total: 0, records: [] },
    // 支票支出 (從支票戶口)
    chequeExpense: { total: 0, records: [] },
    // 現金
    cashIncome: { total: 0, records: [] },
    cashExpense: { total: 0, records: [] },
  };
  
  allRecords?.forEach(t => {
    const isPetty = t.deduct_from_petty_cash === true;
    const method = t.payment_method || '';
    const income = t.income_amount || 0;
    const expense = t.expense_amount || 0;
    const desc = `${t.transaction_date} $${(income || expense).toFixed(2)} ${t.transaction_item?.substring(0, 30) || ''}`;
    
    if (method === '銀行轉賬') {
      if (isPetty) {
        if (income > 0) stats.excludedIncome.records.push({ ...t, desc, reason: 'petty=true' });
        if (expense > 0) stats.excludedExpense.records.push({ ...t, desc, reason: 'petty=true' });
        stats.excludedIncome.total += income;
        stats.excludedExpense.total += expense;
      } else {
        if (income > 0) {
          stats.savingsIncome.total += income;
          stats.savingsIncome.records.push({ ...t, desc });
        }
        if (expense > 0) {
          stats.savingsExpense.total += expense;
          stats.savingsExpense.records.push({ ...t, desc });
        }
      }
    } else if (method === '支票') {
      if (income > 0) {
        if (isPetty) {
          stats.excludedIncome.total += income;
          stats.excludedIncome.records.push({ ...t, desc, reason: 'cheque+petty' });
        } else {
          stats.chequeIncome.total += income;
          stats.chequeIncome.records.push({ ...t, desc });
        }
      }
      if (expense > 0) {
        stats.chequeExpense.total += expense;
        stats.chequeExpense.records.push({ ...t, desc });
      }
    } else if (method === '現金') {
      if (income > 0) {
        stats.cashIncome.total += income;
        stats.cashIncome.records.push({ ...t, desc });
      }
      if (expense > 0) {
        stats.cashExpense.total += expense;
        stats.cashExpense.records.push({ ...t, desc });
      }
    } else {
      // 其他或空白
      if (income > 0) stats.excludedIncome.records.push({ ...t, desc, reason: `method=${method}` });
      if (expense > 0) stats.excludedExpense.records.push({ ...t, desc, reason: `method=${method}` });
    }
  });
  
  // 儲蓄戶口總計 = 銀行轉賬 + 支票收入
  const totalSavingsIncome = stats.savingsIncome.total + stats.chequeIncome.total;
  const totalSavingsExpense = stats.savingsExpense.total;
  
  console.log(`\nIntranet 儲蓄戶口:`);
  console.log(`  銀行轉賬收入: $${stats.savingsIncome.total.toFixed(2)}`);
  console.log(`  支票存入收入: $${stats.chequeIncome.total.toFixed(2)}`);
  console.log(`  總收入: $${totalSavingsIncome.toFixed(2)} (銀行: $${bank.income.toFixed(2)}) → 差 $${(totalSavingsIncome - bank.income).toFixed(2)}`);
  console.log(`  總支出: $${totalSavingsExpense.toFixed(2)} (銀行: $${bank.expense.toFixed(2)}) → 差 $${(totalSavingsExpense - bank.expense).toFixed(2)}`);
  
  const incomeDiff = bank.income - totalSavingsIncome;
  const expenseDiff = bank.expense - totalSavingsExpense;
  
  if (Math.abs(incomeDiff) > 0.01 || Math.abs(expenseDiff) > 0.01) {
    console.log(`\n⚠️ 差異分析:`);
    
    if (Math.abs(incomeDiff) > 0.01) {
      console.log(`\n  收入差 $${incomeDiff.toFixed(2)}:`);
      if (incomeDiff > 0) {
        console.log(`  → Intranet 少了 $${incomeDiff.toFixed(2)} 收入`);
        console.log(`  可能原因: 有收入記錄被標記為 petty cash 或 payment method 不是銀行轉賬/支票`);
        if (stats.excludedIncome.records.length > 0) {
          console.log(`  被排除的收入記錄 (共 ${stats.excludedIncome.records.length} 筆, $${stats.excludedIncome.total.toFixed(2)}):`);
          stats.excludedIncome.records.forEach(r => {
            console.log(`    - ${r.desc} [${r.reason}]`);
          });
        }
      } else {
        console.log(`  → Intranet 多了 $${(-incomeDiff).toFixed(2)} 收入`);
      }
    }
    
    if (Math.abs(expenseDiff) > 0.01) {
      console.log(`\n  支出差 $${expenseDiff.toFixed(2)}:`);
      if (expenseDiff > 0) {
        console.log(`  → Intranet 少了 $${expenseDiff.toFixed(2)} 支出`);
        console.log(`  可能原因: 有支出記錄被標記為 petty cash 或 payment method 不是銀行轉賬`);
        if (stats.excludedExpense.records.length > 0) {
          console.log(`  被排除的支出記錄 (共 ${stats.excludedExpense.records.length} 筆, $${stats.excludedExpense.total.toFixed(2)}):`);
          stats.excludedExpense.records.forEach(r => {
            console.log(`    - ${r.desc} [${r.reason}]`);
          });
        }
      } else {
        console.log(`  → Intranet 多了 $${(-expenseDiff).toFixed(2)} 支出`);
      }
    }
  } else {
    console.log(`\n✅ ${month} 對帳成功!`);
  }
  
  return {
    month,
    incomeDiff,
    expenseDiff,
    stats
  };
}

(async () => {
  console.log('開始全面分析 4月至1月的對帳問題...\n');
  
  const results = [];
  const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];
  
  for (const month of months) {
    const result = await analyzeMonth(month);
    results.push(result);
  }
  
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('總結');
  console.log(`${'='.repeat(80)}`);
  
  let totalIncomeDiff = 0, totalExpenseDiff = 0;
  results.forEach(r => {
    const status = (Math.abs(r.incomeDiff) < 0.01 && Math.abs(r.expenseDiff) < 0.01) ? '✅' : '❌';
    console.log(`${r.month}: ${status} 收入差 $${r.incomeDiff.toFixed(2)}, 支出差 $${r.expenseDiff.toFixed(2)}`);
    totalIncomeDiff += r.incomeDiff;
    totalExpenseDiff += r.expenseDiff;
  });
  
  console.log(`\n累計差異: 收入 $${totalIncomeDiff.toFixed(2)}, 支出 $${totalExpenseDiff.toFixed(2)}`);
  
  process.exit(0);
})();
