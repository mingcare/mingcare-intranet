const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 5月儲蓄戶口 bank statement
  const bankOpening = 103530.96;
  const bankClosing = 41078.53;
  const bankChange = bankClosing - bankOpening; // -62452.43
  
  console.log('=== 5月份儲蓄戶口對帳 ===\n');
  console.log('銀行結單:');
  console.log(`  開始: $${bankOpening.toFixed(2)}`);
  console.log(`  結束: $${bankClosing.toFixed(2)}`);
  console.log(`  變動: $${bankChange.toFixed(2)}`);
  
  // 數據庫記錄
  const { data: records } = await supabase.from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .eq('payment_method', '銀行轉賬')
    .eq('is_deleted', false)
    .order('transaction_date');
  
  let dbIncome = 0;
  let dbExpense = 0;
  
  records.forEach(r => {
    dbIncome += Number(r.income_amount) || 0;
    dbExpense += Number(r.expense_amount) || 0;
  });
  
  const dbChange = dbIncome - dbExpense;
  const dbClosing = bankOpening + dbChange;
  
  console.log('\n數據庫 (銀行轉賬):');
  console.log(`  記錄數: ${records.length} 筆`);
  console.log(`  總收入: $${dbIncome.toFixed(2)}`);
  console.log(`  總支出: $${dbExpense.toFixed(2)}`);
  console.log(`  變動: $${dbChange.toFixed(2)}`);
  console.log(`  計算結餘: $${dbClosing.toFixed(2)}`);
  
  const diff = dbClosing - bankClosing;
  console.log(`\n差異: $${diff.toFixed(2)}`);
  
  if (Math.abs(diff) > 0.01) {
    console.log('\n⚠️ 需要檢查差異來源');
    
    // 詳細分析
    console.log('\n=== 詳細分析 ===\n');
    
    // 按日期分組
    const byDate = {};
    records.forEach(r => {
      const date = r.transaction_date;
      if (!byDate[date]) byDate[date] = { income: 0, expense: 0, records: [] };
      byDate[date].income += Number(r.income_amount) || 0;
      byDate[date].expense += Number(r.expense_amount) || 0;
      byDate[date].records.push(r);
    });
    
    // 銀行 statement 5月份交易 (從用戶提供嘅數據)
    const bankTx = {
      '2025-05-01': { debit: 0, credit: 0 },
      '2025-05-02': { debit: 21165, credit: 50050 },  // DR: 18165+3000, CR: 50000+50
      '2025-05-03': { debit: 68919, credit: 0 },
      '2025-05-04': { debit: 0, credit: 0 },
      '2025-05-05': { debit: 0, credit: 330 },
      '2025-05-06': { debit: 0, credit: 330 },
      '2025-05-07': { debit: 50000, credit: 50110 },
      '2025-05-08': { debit: 8000, credit: 50000 },
      '2025-05-09': { debit: 0, credit: 0 },
      '2025-05-10': { debit: 0, credit: 1800 },
      '2025-05-11': { debit: 0, credit: 720 },
      '2025-05-12': { debit: 0, credit: 0 },
      '2025-05-13': { debit: 0, credit: 765 },
      '2025-05-14': { debit: 0, credit: 3450 },
      '2025-05-15': { debit: 0, credit: 0 },
      '2025-05-16': { debit: 19000, credit: 2600 },
      '2025-05-17': { debit: 0, credit: 0 },
      '2025-05-18': { debit: 0, credit: 0 },
      '2025-05-19': { debit: 0, credit: 450 },
      '2025-05-20': { debit: 0, credit: 450 },
      '2025-05-21': { debit: 0, credit: 300 },
      '2025-05-22': { debit: 0, credit: 4210 },
      '2025-05-23': { debit: 0, credit: 300 },
      '2025-05-24': { debit: 0, credit: 2250 },
      '2025-05-25': { debit: 0, credit: 10000 },
      '2025-05-26': { debit: 4355, credit: 9560 },
      '2025-05-27': { debit: 0, credit: 9750 },
      '2025-05-28': { debit: 0, credit: 0 },
      '2025-05-29': { debit: 0, credit: 3900 },
      '2025-05-30': { debit: 56950, credit: 330 },  // 16150+19000+10000+11800
      '2025-05-31': { debit: 135, credit: 606.57 }  // 手續費135, 利息6.57+300+300
    };
    
    // 實際計算
    let bankTotalDebit = 0;
    let bankTotalCredit = 0;
    Object.values(bankTx).forEach(d => {
      bankTotalDebit += d.debit;
      bankTotalCredit += d.credit;
    });
    
    console.log(`銀行 statement 總計:`);
    console.log(`  總 DR (支出): $${bankTotalDebit.toFixed(2)}`);
    console.log(`  總 CR (收入): $${bankTotalCredit.toFixed(2)}`);
    console.log(`  淨變動: $${(bankTotalCredit - bankTotalDebit).toFixed(2)}`);
    console.log(`  計算結餘: $${(bankOpening + bankTotalCredit - bankTotalDebit).toFixed(2)}`);
    
    // 比較
    console.log('\n=== 差異分析 ===');
    console.log(`DB 收入 vs Bank CR: $${dbIncome.toFixed(2)} vs $${bankTotalCredit.toFixed(2)} = 差 $${(dbIncome - bankTotalCredit).toFixed(2)}`);
    console.log(`DB 支出 vs Bank DR: $${dbExpense.toFixed(2)} vs $${bankTotalDebit.toFixed(2)} = 差 $${(dbExpense - bankTotalDebit).toFixed(2)}`);
  } else {
    console.log('\n✅ 完全吻合！');
  }
})();
