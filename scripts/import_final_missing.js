const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

// 最後遺漏的 2 筆記錄
const records = [
  {
    journal_number: '00000556',
    fiscal_year: '2025',
    billing_month: '2025年1月',
    transaction_date: '2025-01-31',  // 月底日期
    transaction_item: '1月份Joe&Kanas Mpf',
    payment_method: '銀行轉賬',
    expense_category: 'MPF',
    income_amount: 0,
    expense_amount: 3000.00,
    notes: '遺漏記錄補錄',
    deduct_from_petty_cash: false,
    is_deleted: false,
    created_by: 'System Import'
  },
  {
    journal_number: '1046(a)',
    fiscal_year: '2025',
    billing_month: '2025年7月',
    transaction_date: '2025-07-15',
    transaction_item: 'MC21/05 陳小姐15/7陪診服務加時1.5小時',
    payment_method: '銀行轉賬',
    income_category: '護理服務費用',
    income_amount: 150.00,
    expense_amount: 0,
    notes: '遺漏記錄補錄',
    deduct_from_petty_cash: false,
    is_deleted: false,
    created_by: 'System Import'
  }
];

async function importRecords() {
  console.log('正在導入最後 2 筆遺漏的記錄...\n');
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(records)
    .select();
  
  if (error) {
    console.error('導入失敗:', error);
    return;
  }
  
  console.log('✅ 導入成功！');
  data.forEach(r => {
    const amount = r.income_amount ? `收入 $${r.income_amount}` : `支出 $${r.expense_amount}`;
    console.log(`  - ${r.journal_number}: ${r.description} (${amount})`);
  });
  
  // 檢查總數
  const { count } = await supabase
    .from('financial_transactions')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📊 數據庫總記錄數: ${count}`);
}

importRecords();
