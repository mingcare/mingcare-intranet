/**
 * 財務交易數據導入腳本
 * 用於將CSV財務報表數據導入到Supabase
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 文件路徑
const csvFilePath = process.argv[2] || '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表.csv';

/**
 * 清理金額字符串，轉換為數字
 */
function cleanAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  // 移除 $, 逗號, 空格, 換行符等
  const cleaned = amountStr
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/\n/g, '')
    .trim();
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

/**
 * 清理文本字段
 */
function cleanText(text) {
  if (!text) return null;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned === '' ? null : cleaned;
}

/**
 * 解析日期
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // 處理格式: 2024/5/2
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript 月份從0開始
    const day = parseInt(parts[2]);
    return new Date(year, month, day).toISOString().split('T')[0];
  }
  
  return null;
}

/**
 * 提取財政年份
 */
function extractFiscalYear(billingMonth) {
  if (!billingMonth) return null;
  const match = billingMonth.match(/(\d{4})年/);
  return match ? parseInt(match[1]) : null;
}

/**
 * 主要導入函數
 */
async function importCSV() {
  console.log('🚀 開始導入財務數據...');
  console.log(`📁 CSV文件: ${csvFilePath}`);
  
  const transactions = [];
  let rowCount = 0;
  let skippedRows = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        skipEmptyLines: true,
        headers: false, // 不使用第一行作為headers
      }))
      .on('data', (row) => {
        rowCount++;
        
        // 跳過前3行（標題行）
        if (rowCount <= 3) return;
        
        // 獲取數據列
        const columns = Object.values(row);
        
        // 如果沒有序號，跳過這行
        if (!columns[0] || columns[0].trim() === '') {
          skippedRows++;
          return;
        }
        
        const transactionCode = cleanText(columns[0]);
        const billingMonth = cleanText(columns[2]);
        const transactionDate = parseDate(columns[3]);
        const transactionItem = cleanText(columns[4]);
        const paymentMethod = cleanText(columns[5]);
        const incomeCategory = cleanText(columns[6]);
        const expenseCategory = cleanText(columns[7]);
        const incomeAmount = cleanAmount(columns[8]);
        const expenseAmount = cleanAmount(columns[9]);
        const pettyCash = cleanAmount(columns[10]);
        const handler = cleanText(columns[11]);
        const reimbursementStatus = cleanText(columns[12]);
        const fiscalYear = extractFiscalYear(billingMonth);
        
        // 驗證必填字段
        if (!transactionDate || !transactionItem) {
          skippedRows++;
          return;
        }
        
        transactions.push({
          transaction_code: transactionCode,
          billing_month: billingMonth,
          transaction_date: transactionDate,
          transaction_item: transactionItem,
          payment_method: paymentMethod,
          income_category: incomeCategory,
          expense_category: expenseCategory,
          income_amount: incomeAmount,
          expense_amount: expenseAmount,
          petty_cash: pettyCash > 0 ? pettyCash : null,
          handler: handler,
          reimbursement_status: reimbursementStatus,
          fiscal_year: fiscalYear,
        });
      })
      .on('end', async () => {
        console.log(`\n📊 CSV解析完成:`);
        console.log(`   總行數: ${rowCount}`);
        console.log(`   有效交易: ${transactions.length}`);
        console.log(`   跳過行數: ${skippedRows}`);
        
        if (transactions.length === 0) {
          console.log('❌ 沒有有效的交易數據');
          return resolve();
        }
        
        try {
          console.log('\n💾 開始寫入Supabase...');
          
          // 批量插入，每次100筆
          const batchSize = 100;
          let inserted = 0;
          
          for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            
            const { data, error } = await supabase
              .from('financial_transactions')
              .upsert(batch, {
                onConflict: 'transaction_code',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 插入失敗:`, error.message);
              // 繼續處理下一批
            } else {
              inserted += batch.length;
              console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1}: 已插入 ${inserted}/${transactions.length} 筆`);
            }
          }
          
          console.log(`\n✨ 導入完成！共插入 ${inserted} 筆交易記錄`);
          
          // 統計摘要
          const totalIncome = transactions.reduce((sum, t) => sum + t.income_amount, 0);
          const totalExpense = transactions.reduce((sum, t) => sum + t.expense_amount, 0);
          
          console.log('\n📈 財務摘要:');
          console.log(`   總收入: HK$${totalIncome.toLocaleString('zh-HK', { minimumFractionDigits: 2 })}`);
          console.log(`   總支出: HK$${totalExpense.toLocaleString('zh-HK', { minimumFractionDigits: 2 })}`);
          console.log(`   淨額: HK$${(totalIncome - totalExpense).toLocaleString('zh-HK', { minimumFractionDigits: 2 })}`);
          
          resolve();
        } catch (error) {
          console.error('❌ 導入過程發生錯誤:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ 讀取CSV文件時發生錯誤:', error);
        reject(error);
      });
  });
}

// 執行導入
if (require.main === module) {
  importCSV()
    .then(() => {
      console.log('\n🎉 所有操作完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 導入失敗:', error);
      process.exit(1);
    });
}

module.exports = { importCSV };
