const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

(async () => {
  // 獲取下一個流水號
  const { data: seqData, error: seqError } = await supabase.from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single();
  
  if (seqError) { console.error('獲取序號失敗:', seqError); return; }
  
  let lastNumber = seqData.last_number;
  console.log(`當前流水號: ${lastNumber}`);
  
  // 5月份內部轉帳記錄 (儲蓄→支票)
  // 根據銀行 statement：5月2日 DR $18,165 + $3,000
  const transfers = [
    {
      amount: 18165,
      ref: 'EBICT50502044192',
      date: '2025-05-02',
    },
    {
      amount: 3000,
      ref: 'EBICT50502044197',
      date: '2025-05-02',
    }
  ];
  
  console.log('\n=== 新增5月份內部轉帳記錄 ===\n');
  
  for (const transfer of transfers) {
    // 1. 儲蓄戶口出 (expense)
    lastNumber++;
    const savingsJN = lastNumber.toString().padStart(8, '0');
    
    const savingsRecord = {
      journal_number: savingsJN,
      fiscal_year: 2025,
      billing_month: '2025年5月',
      transaction_date: transfer.date,
      transaction_item: `內部轉帳 - 轉到支票戶口 (Ref: ${transfer.ref})`,
      payment_method: '銀行轉賬',
      expense_category: '內部轉帳',
      expense_amount: transfer.amount,
      income_amount: 0,
      handler: 'Joe Cheung',
      notes: '銀行結單對帳 - 2025年5月',
      deduct_from_petty_cash: false,
      is_deleted: false,
      created_by: 'System - Bank Statement Reconciliation'
    };
    
    const { data: d1, error: e1 } = await supabase.from('financial_transactions')
      .insert(savingsRecord)
      .select('journal_number, transaction_item, expense_amount');
    
    if (e1) {
      console.error(`❌ 儲蓄戶口記錄失敗:`, e1);
      continue;
    }
    console.log(`✅ 儲蓄戶口: ${d1[0].journal_number} | ${d1[0].transaction_item} | 支出 $${d1[0].expense_amount}`);
    
    // 2. 支票戶口入 (income)
    lastNumber++;
    const currentJN = lastNumber.toString().padStart(8, '0');
    
    const currentRecord = {
      journal_number: currentJN,
      fiscal_year: 2025,
      billing_month: '2025年5月',
      transaction_date: transfer.date,
      transaction_item: `內部轉帳 - 從儲蓄戶口轉入 (Ref: ${transfer.ref})`,
      payment_method: '支票',
      income_category: '內部轉帳',
      income_amount: transfer.amount,
      expense_amount: 0,
      handler: 'Joe Cheung',
      notes: '銀行結單對帳 - 2025年5月',
      deduct_from_petty_cash: false,
      is_deleted: false,
      created_by: 'System - Bank Statement Reconciliation'
    };
    
    const { data: d2, error: e2 } = await supabase.from('financial_transactions')
      .insert(currentRecord)
      .select('journal_number, transaction_item, income_amount');
    
    if (e2) {
      console.error(`❌ 支票戶口記錄失敗:`, e2);
      continue;
    }
    console.log(`✅ 支票戶口: ${d2[0].journal_number} | ${d2[0].transaction_item} | 收入 $${d2[0].income_amount}`);
    console.log('---');
  }
  
  // 更新流水號序列
  const { error: updateError } = await supabase.from('global_journal_sequence')
    .update({ last_number: lastNumber })
    .eq('id', 1);
  
  if (updateError) {
    console.error('更新序號失敗:', updateError);
  } else {
    console.log(`\n✅ 流水號已更新至: ${lastNumber}`);
  }
  
  // 驗證
  console.log('\n=== 驗證5月份內部轉帳 ===');
  const { data: verify } = await supabase.from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income_amount, expense_amount, payment_method')
    .gte('transaction_date', '2025-05-01')
    .lte('transaction_date', '2025-05-31')
    .or('income_category.eq.內部轉帳,expense_category.eq.內部轉帳')
    .eq('is_deleted', false)
    .order('journal_number');
  
  verify.forEach(r => {
    console.log(`${r.journal_number} | ${r.transaction_date} | ${r.payment_method}`);
    console.log(`  ${r.transaction_item}`);
    console.log(`  Income: $${r.income_amount} | Expense: $${r.expense_amount}`);
  });
})();
