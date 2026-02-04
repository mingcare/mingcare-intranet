const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function checkApril2025Transactions() {
  console.log('==========================================');
  console.log('財務會計 🏦儲蓄戶口 2025年4月 對賬');
  console.log('==========================================\n');

  // Get all transactions for April 2025 (銀行轉賬 only - savings account)
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('billing_month', '2025年4月')
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`總記錄數: ${data.length} 筆\n`);

  // Separate by payment method
  const bankTransfers = data.filter(t => t.payment_method === '銀行轉賬');
  const cashTransactions = data.filter(t => t.payment_method === '現金');
  const otherTransactions = data.filter(t => t.payment_method !== '銀行轉賬' && t.payment_method !== '現金');

  console.log('=== 銀行轉賬交易 (儲蓄戶口) ===\n');
  console.log(`銀行轉賬記錄數: ${bankTransfers.length} 筆\n`);

  let totalIncome = 0;
  let totalExpense = 0;

  console.log('日期\t\t流水號\t\t項目\t\t\t\t\t收入\t\t支出');
  console.log('-'.repeat(120));

  bankTransfers.forEach(t => {
    const date = t.transaction_date;
    const journal = t.journal_number || '-';
    const item = t.transaction_item ? t.transaction_item.substring(0, 30).padEnd(30) : '-'.padEnd(30);
    const income = t.income_amount || 0;
    const expense = t.expense_amount || 0;
    
    totalIncome += parseFloat(income);
    totalExpense += parseFloat(expense);
    
    console.log(`${date}\t${journal}\t${item}\t${income > 0 ? income.toFixed(2) : '-'}\t\t${expense > 0 ? expense.toFixed(2) : '-'}`);
  });

  console.log('-'.repeat(120));
  console.log(`\n銀行轉賬總收入: $${totalIncome.toFixed(2)}`);
  console.log(`銀行轉賬總支出: $${totalExpense.toFixed(2)}`);
  console.log(`銀行轉賬淨額: $${(totalIncome - totalExpense).toFixed(2)}`);

  // Bank statement summary
  console.log('\n=== 銀行月結單摘要 ===');
  console.log('開戶結餘 (31-Mar-25): $82,755.59');
  console.log('結單結餘 (30-Apr-25): $103,530.96');
  console.log('總存入: $182,468.61');
  console.log('總支出: $161,693.24');
  console.log('淨變化: $20,775.37');

  // Detailed comparison
  console.log('\n=== 詳細對比 ===\n');

  // Parse bank statement transactions
  const bankStatementTransactions = [
    // Withdrawals (支出)
    { date: '02-Apr-25', amount: 1500, type: 'W', desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '03-Apr-25', amount: 14250, type: 'W', desc: 'Ho Ka Fung Candy (FPS)' },
    { date: '03-Apr-25', amount: 1500, type: 'W', desc: 'Leung Hui Fung (FPS)' },
    { date: '03-Apr-25', amount: 300, type: 'W', desc: 'Tang Kwok Hung (FPS)' },
    { date: '03-Apr-25', amount: 700, type: 'W', desc: 'Chick Ka Wai (FPS)' },
    { date: '03-Apr-25', amount: 6010, type: 'W', desc: 'Suen Ming Kuen (FPS)' },
    { date: '03-Apr-25', amount: 1250, type: 'W', desc: 'Kuang Qian Wen (FPS)' },
    { date: '03-Apr-25', amount: 1200, type: 'W', desc: 'Cheng Sau Chun (FPS)' },
    { date: '03-Apr-25', amount: 1490, type: 'W', desc: 'Wang Li Hong (FPS)' },
    { date: '03-Apr-25', amount: 5800, type: 'W', desc: 'Yu Chui Ying Ken (FPS)' },
    { date: '03-Apr-25', amount: 13470, type: 'W', desc: 'MINGCARE HOME (Internal Transfer)' },
    { date: '03-Apr-25', amount: 3430, type: 'W', desc: 'Lau Suet Nagi (FPS)' },
    { date: '03-Apr-25', amount: 1650, type: 'W', desc: 'Yu Yung Hsu (FPS)' },
    { date: '03-Apr-25', amount: 4200, type: 'W', desc: 'Yu Tsui King (FPS)' },
    { date: '03-Apr-25', amount: 450, type: 'W', desc: 'Wang Dong Ming (FPS)' },
    { date: '03-Apr-25', amount: 7120, type: 'W', desc: 'Pu Chunrong (FPS)' },
    { date: '03-Apr-25', amount: 4670, type: 'W', desc: 'Chu Tung Ping (FPS)' },
    { date: '03-Apr-25', amount: 2200, type: 'W', desc: 'Chuk Fung Sin (FPS)' },
    { date: '08-Apr-25', amount: 4000, type: 'W', desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '08-Apr-25', amount: 4160, type: 'W', desc: 'Yeung Yee On (FPS)' },
    { date: '08-Apr-25', amount: 2800, type: 'W', desc: 'Ho Ka Fung Candy (FPS)' },
    { date: '08-Apr-25', amount: 3000, type: 'W', desc: 'Ho Ka Fung Candy (FPS)' },
    { date: '15-Apr-25', amount: 19000, type: 'W', desc: 'Leung Pui Man Kanas (FPS)' },
    { date: '24-Apr-25', amount: 75, type: 'W', desc: 'AIA CO (T) LTD - P E6MK04' },
    { date: '26-Apr-25', amount: 19000, type: 'W', desc: 'Cheung Kwun Ho (FPS)' },
    { date: '30-Apr-25', amount: 638.24, type: 'W', desc: 'Kyocera Document Solutions' },
    { date: '30-Apr-25', amount: 11800, type: 'W', desc: 'Ruby Investment Ltd (Rent)' },
    // FPS fees (many $5 fees)
    
    // Deposits (存入)
    { date: '02-Apr-25', amount: 7500, type: 'D', desc: 'MISS LAM SIU FONG (FPS)' },
    { date: '03-Apr-25', amount: 1040, type: 'D', desc: 'CHEQUE DEPOSIT 701210' },
    { date: '05-Apr-25', amount: 600, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '06-Apr-25', amount: 1800, type: 'D', desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '07-Apr-25', amount: 3430, type: 'D', desc: 'CR 1513RF1241291' },
    { date: '07-Apr-25', amount: 1560, type: 'D', desc: 'YAU YUET WA ANRIQUE (FPS)' },
    { date: '08-Apr-25', amount: 50000, type: 'D', desc: 'MR YAU KIN NAM (FPS)' },
    { date: '12-Apr-25', amount: 1800, type: 'D', desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '13-Apr-25', amount: 300, type: 'D', desc: 'WONG HAU YEE (FPS)' },
    { date: '13-Apr-25', amount: 1800, type: 'D', desc: 'MISS CHAN MEI WING (FPS)' },
    { date: '13-Apr-25', amount: 330, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '13-Apr-25', amount: 300, type: 'D', desc: 'WONG HAU YEE (FPS)' },
    { date: '13-Apr-25', amount: 1200, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '14-Apr-25', amount: 330, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '14-Apr-25', amount: 300, type: 'D', desc: 'MR CHAN YIU MAN (FPS)' },
    { date: '14-Apr-25', amount: 300, type: 'D', desc: 'CHAN KA YAN (FPS)' },
    { date: '15-Apr-25', amount: 250, type: 'D', desc: 'MISS KWAN MAN KEE (FPS)' },
    { date: '16-Apr-25', amount: 720, type: 'D', desc: 'CHAN WING YAN (FPS)' },
    { date: '16-Apr-25', amount: 300, type: 'D', desc: 'NG PUI LIN CHIRISTLINE (FPS)' },
    { date: '17-Apr-25', amount: 1040, type: 'D', desc: 'YAU YUET WA ANRIQUE (FPS)' },
    { date: '18-Apr-25', amount: 1200, type: 'D', desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '19-Apr-25', amount: 300, type: 'D', desc: 'WONG MAN YEE (FPS)' },
    { date: '19-Apr-25', amount: 400, type: 'D', desc: 'MISS CHAN MEI WING (FPS)' },
    { date: '19-Apr-25', amount: 600, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '20-Apr-25', amount: 5525, type: 'D', desc: 'MR KWOK KAM TIM (FPS)' },
    { date: '22-Apr-25', amount: 50, type: 'D', desc: 'WONG MAN YEE (FPS)' },
    { date: '23-Apr-25', amount: 900, type: 'D', desc: 'LEUNG, Pui Man Kanas (FPS)' },
    { date: '24-Apr-25', amount: 900, type: 'D', desc: 'LUI, Yuen Wan Vivian (FPS)' },
    { date: '25-Apr-25', amount: 1800, type: 'D', desc: 'MISS HO TAK CHUI (FPS)' },
    { date: '26-Apr-25', amount: 9000, type: 'D', desc: 'MISS LAM SIU FONG (FPS)' },
    { date: '27-Apr-25', amount: 600, type: 'D', desc: 'LEE YUK CHUN (FPS)' },
    { date: '28-Apr-25', amount: 300, type: 'D', desc: 'MISS YAN KA WING (FPS)' },
    { date: '28-Apr-25', amount: 560, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '28-Apr-25', amount: 330, type: 'D', desc: 'MR YIP CHU LEUNG (FPS)' },
    { date: '28-Apr-25', amount: 10000, type: 'D', desc: 'SLASHER BUILDER LIMITED (FPS)' },
    { date: '29-Apr-25', amount: 750, type: 'D', desc: 'LEUNG PUI MAN KANAS (FPS)' },
    { date: '30-Apr-25', amount: 50000, type: 'D', desc: 'MR YAU KIN NAM (FPS)' },
    { date: '30-Apr-25', amount: 1858, type: 'D', desc: 'SLASHER BUILDER LIMITED (FPS)' },
    { date: '30-Apr-25', amount: 5.61, type: 'D', desc: 'INTEREST' },
  ];

  // Summary from bank statement (calculated from statement)
  const bankDeposits = bankStatementTransactions.filter(t => t.type === 'D');
  const bankWithdrawals = bankStatementTransactions.filter(t => t.type === 'W');
  
  const totalBankDeposits = bankDeposits.reduce((sum, t) => sum + t.amount, 0);
  const totalBankWithdrawals = bankWithdrawals.reduce((sum, t) => sum + t.amount, 0);

  console.log('主要存入 (Income) 對比:');
  console.log(`  銀行結單存入: $${totalBankDeposits.toFixed(2)} (不含FPS退款)`);
  console.log(`  系統記錄收入: $${totalIncome.toFixed(2)}`);
  
  console.log('\n主要支出 (Expense) 對比:');
  console.log(`  銀行結單支出: $${totalBankWithdrawals.toFixed(2)} (不含FPS手續費)`);
  console.log(`  系統記錄支出: $${totalExpense.toFixed(2)}`);

  // Show all transactions grouped by category
  console.log('\n=== 系統記錄按類別分組 ===\n');
  
  const incomeByCategory = {};
  const expenseByCategory = {};
  
  bankTransfers.forEach(t => {
    if (t.income_amount > 0) {
      const cat = t.income_category || '未分類';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + parseFloat(t.income_amount);
    }
    if (t.expense_amount > 0) {
      const cat = t.expense_category || '未分類';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + parseFloat(t.expense_amount);
    }
  });

  console.log('收入分類:');
  Object.keys(incomeByCategory).forEach(cat => {
    console.log(`  ${cat}: $${incomeByCategory[cat].toFixed(2)}`);
  });

  console.log('\n支出分類:');
  Object.keys(expenseByCategory).forEach(cat => {
    console.log(`  ${cat}: $${expenseByCategory[cat].toFixed(2)}`);
  });
}

checkApril2025Transactions().catch(console.error);
