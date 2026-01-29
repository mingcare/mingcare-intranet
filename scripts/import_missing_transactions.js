const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 43筆缺少單號的交易記錄（從CSV提取）
// 使用 EX-0001 格式的單號，不影響現有的純數字流水號
// 注意：petty_cash 欄位在數據庫不存在，不需要入
const transactions = [
  // 2024年6月
  { billing_month: '2024年6月', transaction_date: '2024-06-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 14.00 },
  
  // 2024年7月
  { billing_month: '2024年7月', transaction_date: '2024-07-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 20.00 },
  { billing_month: '2024年7月', transaction_date: '2024-07-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 41.00 },
  { billing_month: '2024年7月', transaction_date: '2024-07-16', transaction_item: 'Petty Cash', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 20000.00 },
  { billing_month: '2024年7月', transaction_date: '2024-07-31', transaction_item: 'Petty Cash', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 10000.00 },
  
  // 2024年8月
  { billing_month: '2024年8月', transaction_date: '2024-08-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 12.00 },
  { billing_month: '2024年8月', transaction_date: '2024-08-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 21.00 },
  
  // 2024年9月
  { billing_month: '2024年9月', transaction_date: '2024-09-26', transaction_item: 'Mr.yau (Petty Cash)', payment_method: '現金', income_category: '股東資本', income_amount: 16000.00 },
  { billing_month: '2024年9月', transaction_date: '2024-09-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 15.00 },
  { billing_month: '2024年9月', transaction_date: '2024-09-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 40.00 },
  
  // 2024年10月
  { billing_month: '2024年10月', transaction_date: '2024-10-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 45.00 },
  { billing_month: '2024年10月', transaction_date: '2024-10-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 29.00 },
  
  // 2024年11月
  { billing_month: '2024年11月', transaction_date: '2024-11-20', transaction_item: 'Petty Cash (公司戶口)', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 5000.00 },
  { billing_month: '2024年11月', transaction_date: '2024-11-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 85.00 },
  { billing_month: '2024年11月', transaction_date: '2024-11-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 15.00 },
  
  // 2024年12月
  { billing_month: '2024年12月', transaction_date: '2024-12-10', transaction_item: 'Petty Cash (公司戶口)', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 3000.00 },
  { billing_month: '2024年12月', transaction_date: '2024-12-27', transaction_item: 'Petty Cash (公司戶口)', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 4000.00 },
  { billing_month: '2024年12月', transaction_date: '2024-12-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 130.00 },
  { billing_month: '2024年12月', transaction_date: '2024-12-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 14.00 },
  
  // 2025年1月
  { billing_month: '2025年1月', transaction_date: '2025-01-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 7.00 },
  { billing_month: '2025年1月', transaction_date: '2025-01-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 90.00 },
  
  // 2025年2月
  { billing_month: '2025年2月', transaction_date: '2025-02-28', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 7.00 },
  { billing_month: '2025年2月', transaction_date: '2025-02-28', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 90.00 },
  
  // 2025年3月
  { billing_month: '2025年3月', transaction_date: '2025-03-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 8.17 },
  { billing_month: '2025年3月', transaction_date: '2025-03-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 115.00 },
  
  // 2025年4月
  { billing_month: '2025年4月', transaction_date: '2025-04-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 110.00 },
  { billing_month: '2025年4月', transaction_date: '2025-04-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 5.61 },
  
  // 2025年5月 (有重複記錄)
  { billing_month: '2025年5月', transaction_date: '2025-05-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 6.57 },
  { billing_month: '2025年5月', transaction_date: '2025-05-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 135.00 },
  { billing_month: '2025年5月', transaction_date: '2025-05-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 135.00 },
  { billing_month: '2025年5月', transaction_date: '2025-05-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 6.57 },
  
  // 2025年6月
  { billing_month: '2025年6月', transaction_date: '2025-06-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 155.00 },
  { billing_month: '2025年6月', transaction_date: '2025-06-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 5.24 },
  
  // 2025年7月
  { billing_month: '2025年7月', transaction_date: '2025-07-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 125.00 },
  { billing_month: '2025年7月', transaction_date: '2025-07-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 9.43 },
  
  // 2025年8月
  { billing_month: '2025年8月', transaction_date: '2025-08-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 150.00 },
  { billing_month: '2025年8月', transaction_date: '2025-08-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 7.36 },
  
  // 2025年9月
  { billing_month: '2025年9月', transaction_date: '2025-09-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 8.53 },
  { billing_month: '2025年9月', transaction_date: '2025-09-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 160.00 },
  
  // 2025年10月
  { billing_month: '2025年10月', transaction_date: '2025-10-31', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 9.79 },
  { billing_month: '2025年10月', transaction_date: '2025-10-31', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 185.00 },
  
  // 2025年11月
  { billing_month: '2025年11月', transaction_date: '2025-11-30', transaction_item: '銀行利息', payment_method: '銀行轉賬', income_category: '銀行利息', income_amount: 5.29 },
  { billing_month: '2025年11月', transaction_date: '2025-11-30', transaction_item: '銀行手續費', payment_method: '銀行轉賬', expense_category: '銀行手續費', expense_amount: 185.00 },
];

async function importTransactions() {
  console.log(`準備導入 ${transactions.length} 筆交易記錄...`);
  console.log('使用 EX-0001 ~ EX-0043 格式的單號\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const journalNumber = `EX-${String(i + 1).padStart(4, '0')}`; // EX-0001, EX-0002...
    
    // 從 billing_month 提取年份
    const yearMatch = t.billing_month.match(/(\d{4})年/);
    const fiscalYear = yearMatch ? parseInt(yearMatch[1]) : 2024;
    
    const record = {
      journal_number: journalNumber,
      fiscal_year: fiscalYear,
      billing_month: t.billing_month,
      transaction_date: t.transaction_date,
      transaction_item: t.transaction_item,
      payment_method: t.payment_method || null,
      income_category: t.income_category || null,
      income_amount: t.income_amount || 0,
      expense_category: t.expense_category || null,
      expense_amount: t.expense_amount || 0,
      handler: null,
      reimbursement_status: null,
      notes: '從CSV補錄（原無單號）',
      deduct_from_petty_cash: false,
      is_deleted: false,
      created_by: 'System Import',
    };
    
    const { error } = await supabase
      .from('financial_transactions')
      .insert(record);
    
    if (error) {
      console.log(`❌ ${journalNumber} 失敗: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✅ ${journalNumber} - ${t.billing_month} ${t.transaction_item} ${t.income_amount > 0 ? '+$' + t.income_amount : '-$' + t.expense_amount}`);
      successCount++;
    }
  }
  
  console.log('\n=== 導入完成 ===');
  console.log(`成功: ${successCount} 筆`);
  console.log(`失敗: ${errorCount} 筆`);
  console.log(`單號範圍: EX-0001 ~ EX-${String(transactions.length).padStart(4, '0')}`);
}

importTransactions();
