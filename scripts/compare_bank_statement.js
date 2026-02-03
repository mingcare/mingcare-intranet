/**
 * 銀行結單對比工具
 * 用法: node scripts/compare_bank_statement.js --year=2025 --month=5
 * 
 * 功能：
 * 1. 從數據庫獲取指定月份的銀行轉賬交易
 * 2. 計算收入和支出總額
 * 3. 與銀行結單對比
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

// 解析命令行參數
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    args[key] = value;
  });
  return args;
}

// 獲取月份的開始和結束日期
function getMonthRange(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

// 主要比較函數
async function compareBankStatement(year, month, bankData = null) {
  const { startDate, endDate } = getMonthRange(year, month);
  
  console.log('═'.repeat(70));
  console.log(`  銀行結單對比工具 - ${year}年${month}月`);
  console.log('═'.repeat(70));
  console.log(`\n📅 交易日期範圍: ${startDate} 至 ${endDate}\n`);

  // 獲取數據庫交易記錄（只取銀行轉賬，排除現金和空白付款方式）
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('payment_method', '銀行轉賬')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ 數據庫錯誤:', error);
    return;
  }

  // 計算數據庫總額
  let dbTotalIncome = 0;
  let dbTotalExpense = 0;
  const dbTransactions = [];

  data.forEach(t => {
    const income = parseFloat(t.income_amount) || 0;
    const expense = parseFloat(t.expense_amount) || 0;
    dbTotalIncome += income;
    dbTotalExpense += expense;
    dbTransactions.push({
      date: t.transaction_date,
      journal: t.journal_number,
      item: t.transaction_item,
      income,
      expense,
      category: t.income_category || t.expense_category
    });
  });

  // 顯示數據庫摘要
  console.log('┌' + '─'.repeat(68) + '┐');
  console.log('│  📊 數據庫記錄摘要 (銀行轉賬)                                     │');
  console.log('├' + '─'.repeat(68) + '┤');
  console.log(`│  記錄數量: ${data.length} 筆                                                    │`.substring(0, 70) + '│');
  console.log(`│  總收入:   HK$${dbTotalIncome.toFixed(2)}                                       │`.substring(0, 70) + '│');
  console.log(`│  總支出:   HK$${dbTotalExpense.toFixed(2)}                                       │`.substring(0, 70) + '│');
  console.log(`│  淨變動:   HK$${(dbTotalIncome - dbTotalExpense).toFixed(2)}                     │`.substring(0, 70) + '│');
  console.log('└' + '─'.repeat(68) + '┘');

  // 如果提供了銀行數據，進行比較
  if (bankData) {
    const openingBalance = bankData.openingBalance;
    const bankClosingBalance = bankData.closingBalance;
    const dbClosingBalance = openingBalance + dbTotalIncome - dbTotalExpense;
    const difference = dbClosingBalance - bankClosingBalance;

    console.log('\n┌' + '─'.repeat(68) + '┐');
    console.log('│  🏦 儲蓄戶口結餘對比                                             │');
    console.log('├' + '─'.repeat(68) + '┤');
    console.log(`│  開始結餘:     HK$${openingBalance.toFixed(2)}                                 │`.substring(0, 70) + '│');
    console.log(`│  銀行結單結餘: HK$${bankClosingBalance.toFixed(2)}                              │`.substring(0, 70) + '│');
    console.log(`│  數據庫結餘:   HK$${dbClosingBalance.toFixed(2)}                                │`.substring(0, 70) + '│');
    console.log('├' + '─'.repeat(68) + '┤');
    
    if (Math.abs(difference) < 0.01) {
      console.log('│  ✅ 結果: 完全匹配！                                             │');
    } else {
      console.log(`│  ⚠️  差異: HK$${difference.toFixed(2)}                                        │`.substring(0, 70) + '│');
    }
    console.log('└' + '─'.repeat(68) + '┘');

    // 如果有差異，顯示詳細交易記錄
    if (Math.abs(difference) >= 0.01) {
      console.log('\n📋 詳細交易記錄 (需要檢查):');
      console.log('─'.repeat(100));
      console.log('日期\t\t流水號\t\t\t收入\t\t支出\t\t描述');
      console.log('─'.repeat(100));
      dbTransactions.forEach(t => {
        const incStr = t.income ? `$${t.income}` : '-';
        const expStr = t.expense ? `$${t.expense}` : '-';
        console.log(`${t.date}\t${t.journal || '-'}\t\t${incStr}\t\t${expStr}\t\t${(t.item || '').substring(0, 25)}`);
      });
      console.log('─'.repeat(100));
    }

    return {
      match: Math.abs(difference) < 0.01,
      difference,
      dbClosingBalance,
      bankClosingBalance
    };
  }

  // 顯示所有交易記錄供檢查
  console.log('\n📋 數據庫交易記錄:');
  console.log('─'.repeat(110));
  console.log('日期\t\t流水號\t\t\t收入\t\t支出\t\t類別\t\t\t描述');
  console.log('─'.repeat(110));
  dbTransactions.forEach(t => {
    const incStr = t.income ? `$${t.income}` : '-';
    const expStr = t.expense ? `$${t.expense}` : '-';
    console.log(`${t.date}\t${t.journal || '-'}\t\t${incStr}\t\t${expStr}\t\t${(t.category || '-').substring(0, 12)}\t\t${(t.item || '').substring(0, 20)}`);
  });
  console.log('─'.repeat(110));

  return { dbTotalIncome, dbTotalExpense, transactions: dbTransactions };
}

// 執行
async function main() {
  const args = parseArgs();
  const year = parseInt(args.year) || 2025;
  const month = parseInt(args.month) || 5;

  // 銀行結單數據 (可以根據需要添加更多月份)
  const bankStatements = {
    '2025-4': {
      openingBalance: 82755.59,
      closingBalance: 103530.96
    },
    '2025-5': {
      openingBalance: 103530.96,
      closingBalance: 41078.53
    }
  };

  const key = `${year}-${month}`;
  const bankData = bankStatements[key];

  if (bankData) {
    await compareBankStatement(year, month, bankData);
  } else {
    console.log(`⚠️  無 ${year}年${month}月 的銀行結單數據，只顯示數據庫記錄`);
    console.log('   請在腳本中的 bankStatements 添加該月份的 openingBalance 和 closingBalance\n');
    await compareBankStatement(year, month);
  }
}

main();
