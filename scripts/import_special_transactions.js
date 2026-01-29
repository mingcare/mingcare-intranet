const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 48筆特殊單號的交易記錄
const specialTransactions = [
  // 14(A), 14(B)
  { journal_number: '14(A)', billing_month: '2024年5月', transaction_date: '2024-05-27', transaction_item: '公司招牌', payment_method: '現金', expense_category: '辦公用品', expense_amount: 350.00 },
  { journal_number: '14(B)', billing_month: '2024年6月', transaction_date: '2024-06-04', transaction_item: '公司招牌', payment_method: '現金', expense_category: '辦公用品', expense_amount: 4800.00 },
  
  // 1A, 1B
  { journal_number: '1A', billing_month: '2024年4月', transaction_date: '2024-04-26', transaction_item: '邱先生注資', payment_method: '現金', income_category: '股東資本', income_amount: 50000.00 },
  { journal_number: '1B', billing_month: '2024年5月', transaction_date: '2024-05-02', transaction_item: '邱先生注資', payment_method: '現金', income_category: '股東資本', income_amount: 50000.00 },
  
  // 200a, 200b, 200c
  { journal_number: '200a', billing_month: '2024年10月', transaction_date: '2024-10-06', transaction_item: 'PHD(姐姐)', payment_method: '現金', expense_category: '辦公用品', expense_amount: 184.00 },
  { journal_number: '200b', billing_month: '2024年10月', transaction_date: '2024-10-06', transaction_item: 'PHD(姐姐)', payment_method: '現金', expense_category: '辦公用品', expense_amount: 556.00 },
  { journal_number: '200c', billing_month: '2024年10月', transaction_date: '2024-10-06', transaction_item: 'PHD(姐姐)', payment_method: '現金', expense_category: '辦公用品', expense_amount: 327.00 },
  
  // 238a, 238b
  { journal_number: '238a', billing_month: '2024年10月', transaction_date: '2024-10-08', transaction_item: 'Mr.yau', payment_method: '現金', income_category: '股東資本', income_amount: 7500.00 },
  { journal_number: '238b', billing_month: '2024年10月', transaction_date: '2024-10-19', transaction_item: 'Mr.yau', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 5000.00 },
  
  // 273(a)
  { journal_number: '273(a)', billing_month: '2024年11月', transaction_date: '2024-11-01', transaction_item: '郭小姐 上門護理服務 每天3hrs $100/hr 15/11,18/11-22/11', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 500.00 },
  
  // 379(a), 379(b)
  { journal_number: '379(a)', billing_month: '2024年12月', transaction_date: '2024-12-14', transaction_item: '郭小姐上門護理服務', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 250.00 },
  { journal_number: '379(b)', billing_month: '2024年12月', transaction_date: '2024-12-16', transaction_item: '郭小姐上門護理服務', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 150.00 },
  
  // R1-R14
  { journal_number: 'R1', billing_month: '2024年6月', transaction_date: '2024-06-01', transaction_item: '邱先生注資', payment_method: '現金', income_category: '股東資本', income_amount: 40000.00 },
  { journal_number: 'R2', billing_month: '2024年6月', transaction_date: '2024-06-20', transaction_item: '邱先生注資', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 60000.00 },
  { journal_number: 'R3', billing_month: '2024年7月', transaction_date: '2024-06-30', transaction_item: 'Dr.Owen', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 6000.00 },
  { journal_number: 'R4', billing_month: '2024年7月', transaction_date: '2024-07-03', transaction_item: '葉小姐', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 7000.00 },
  { journal_number: 'R5', billing_month: '2024年7月', transaction_date: '2024-07-05', transaction_item: 'Dr.Owen', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 2550.00 },
  { journal_number: 'R6', billing_month: '2024年7月', transaction_date: '2024-07-22', transaction_item: 'Joe Cheung', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 2610.50 },
  { journal_number: 'R7', billing_month: '2024年10月', transaction_date: '2024-10-02', transaction_item: '10月份租金', payment_method: '銀行轉賬', expense_category: '租金', expense_amount: 11800.00 },
  { journal_number: 'R8', billing_month: '2024年9月', transaction_date: '2024-09-27', transaction_item: 'kanas 9 月份人工', payment_method: '銀行轉賬', expense_category: '辦公室同事工資', expense_amount: 9500.00 },
  { journal_number: 'R9', billing_month: '2024年9月', transaction_date: '2024-09-27', transaction_item: '邱先生注資', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 40000.00 },
  { journal_number: 'R10', billing_month: '2024年11月', transaction_date: '2024-10-02', transaction_item: '11月份租金', payment_method: '銀行轉賬', expense_category: '租金', expense_amount: 11800.00 },
  { journal_number: 'R11', billing_month: '2024年10月', transaction_date: '2024-10-07', transaction_item: '邱先生注資', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 50000.00 },
  { journal_number: 'R12', billing_month: '2024年12月', transaction_date: '2024-11-27', transaction_item: '12月份租金', payment_method: '銀行轉賬', expense_category: '租金', expense_amount: 11800.00 },
  { journal_number: 'R13', billing_month: '2024年11月', transaction_date: '2024-11-24', transaction_item: '邱先生注資', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 50000.00 },
  { journal_number: 'R14', billing_month: '2024年12月', transaction_date: '2024-12-17', transaction_item: 'Joe 12月份人工', payment_method: '銀行轉賬', expense_category: '辦公室同事工資', expense_amount: 14250.00 },
  
  // 1202A 系列
  { journal_number: '1202A', billing_month: '2025年9月', transaction_date: '2025-08-29', transaction_item: '9月份租金', payment_method: '銀行轉賬', expense_category: '租金', expense_amount: 11800.00 },
  { journal_number: '1208A', billing_month: '2025年9月', transaction_date: '2025-09-03', transaction_item: '股東提現金 (支票No.42商務消費)', payment_method: '銀行轉賬', expense_category: '商務餐', expense_amount: 20000.00 },
  { journal_number: '1223A', billing_month: '2025年9月', transaction_date: '2025-09-05', transaction_item: 'Petty Cash (公司戶口轉帳)', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 4000.00 },
  { journal_number: '1309A', billing_month: '2025年10月', transaction_date: '2025-09-29', transaction_item: '10月份租金', payment_method: '銀行轉賬', expense_category: '租金', expense_amount: 11800.00 },
  { journal_number: '1445A', billing_month: '2025年11月', transaction_date: '2025-11-05', transaction_item: 'MC39/06 梁小姐6/11上門護理服務補回2.5小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 380.00 },
  { journal_number: '1453A', billing_month: '2025年11月', transaction_date: '2025-11-06', transaction_item: 'MC79/06 Vicky Au RN上門護理服務共57.5小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 11500.00 },
  { journal_number: '1465A', billing_month: '2025年10月', transaction_date: '2025-11-06', transaction_item: '譚文慧 10月份工資,支票No.99', payment_method: '銀行轉賬', expense_category: '護理人員工資', expense_amount: 3505.00 },
  { journal_number: '1508A', billing_month: '2025年11月', transaction_date: '2025-11-14', transaction_item: 'MC39/09 邱小姐 18/11,20/11上門護理服務共6小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 900.00 },
  { journal_number: '1528A', billing_month: '2025年11月', transaction_date: '2025-11-18', transaction_item: '商務餐 (Mr Fu)', payment_method: '銀行轉賬', expense_category: '商務餐', expense_amount: 3000.00 },
  { journal_number: '1531A', billing_month: '2025年11月', transaction_date: '2025-11-21', transaction_item: '科技券退回申請費用', payment_method: '銀行轉賬', income_category: '股東資本', income_amount: 20000.00 },
  { journal_number: '1533A', billing_month: '2025年11月', transaction_date: '2025-11-21', transaction_item: '退款給客戶', payment_method: '銀行轉賬', expense_category: '客人退款', expense_amount: 450.00 },
  { journal_number: '1549A', billing_month: '2025年11月', transaction_date: '2025-11-28', transaction_item: 'Joe11月份工資', payment_method: '銀行轉賬', expense_category: '辦公室同事工資', expense_amount: 28500.00 },
  { journal_number: '1563A', billing_month: '2025年12月', transaction_date: '2025-12-01', transaction_item: 'Petty Cash (公司戶口轉帳)', payment_method: '銀行轉賬', expense_category: 'Petty Cash', expense_amount: 5000.00 },
  { journal_number: '1565A', billing_month: '2025年12月', transaction_date: '2025-12-01', transaction_item: 'MC86/01 鍾煜文 03/12 陪診服務3小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 420.00 },
  { journal_number: '1576A', billing_month: '2025年12月', transaction_date: '2025-12-04', transaction_item: 'Unicorn Creative Limited 申請按金', payment_method: '銀行轉賬', expense_category: '辦公費用', expense_amount: 5000.00 },
  { journal_number: '1643A', billing_month: '2025年12月', transaction_date: '2025-12-13', transaction_item: '影印3份Intake表格', payment_method: '現金', expense_category: '辦公用品', expense_amount: 18.00, handler: 'Candy Ho', reimbursement_status: '已完成' },
  { journal_number: '1678A', billing_month: '2025年7月', transaction_date: '2025-12-24', transaction_item: '醫點7月份服務費', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 102395.00 },
  { journal_number: '1696A', billing_month: '2026年1月', transaction_date: '2026-01-02', transaction_item: 'MC0087/02 譚碧娥傷口護理4小時+護理物品費用', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 2729.00 },
  { journal_number: '1697A', billing_month: '2026年1月', transaction_date: '2026-01-02', transaction_item: 'MC79/08 Vicky Au 1月份 護士上門服務共80.5小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 16100.00 },
  { journal_number: '1699A', billing_month: '2025年11月', transaction_date: '2026-01-02', transaction_item: 'Steven $140 Case 11月份服務費', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 13620.00 },
  { journal_number: '1699B', billing_month: '2026年1月', transaction_date: '2026-01-04', transaction_item: 'MC88/01 梅小姐夜間服務Plan 第一期費用', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 6000.00 },
  { journal_number: '1699C', billing_month: '2026年1月', transaction_date: '2026-01-04', transaction_item: 'MC86/07 鍾煜文 5/1 陪診服務6小時', payment_method: '銀行轉賬', income_category: '護理服務費用', income_amount: 840.00 },
];

async function importSpecialTransactions() {
  console.log(`準備檢查和導入 ${specialTransactions.length} 筆特殊單號記錄...\n`);
  
  let existCount = 0;
  let importCount = 0;
  let errorCount = 0;
  
  for (const t of specialTransactions) {
    // 先檢查是否已存在
    const { data: existing } = await supabase
      .from('financial_transactions')
      .select('id, journal_number')
      .eq('journal_number', t.journal_number)
      .single();
    
    if (existing) {
      console.log(`⏭️  ${t.journal_number} 已存在，跳過`);
      existCount++;
      continue;
    }
    
    // 從 billing_month 提取年份
    const yearMatch = t.billing_month.match(/(\d{4})年/);
    const fiscalYear = yearMatch ? parseInt(yearMatch[1]) : 2024;
    
    const record = {
      journal_number: t.journal_number,
      fiscal_year: fiscalYear,
      billing_month: t.billing_month,
      transaction_date: t.transaction_date,
      transaction_item: t.transaction_item,
      payment_method: t.payment_method || null,
      income_category: t.income_category || null,
      income_amount: t.income_amount || 0,
      expense_category: t.expense_category || null,
      expense_amount: t.expense_amount || 0,
      handler: t.handler || null,
      reimbursement_status: t.reimbursement_status || null,
      notes: '特殊單號補錄',
      deduct_from_petty_cash: false,
      is_deleted: false,
      created_by: 'System Import',
    };
    
    const { error } = await supabase
      .from('financial_transactions')
      .insert(record);
    
    if (error) {
      console.log(`❌ ${t.journal_number} 失敗: ${error.message}`);
      errorCount++;
    } else {
      const amount = t.income_amount > 0 ? `+$${t.income_amount.toLocaleString()}` : `-$${t.expense_amount.toLocaleString()}`;
      console.log(`✅ ${t.journal_number} - ${t.billing_month} ${t.transaction_item.substring(0, 20)}... ${amount}`);
      importCount++;
    }
  }
  
  console.log('\n=== 導入完成 ===');
  console.log(`已存在: ${existCount} 筆`);
  console.log(`新導入: ${importCount} 筆`);
  console.log(`失敗: ${errorCount} 筆`);
}

importSpecialTransactions();
