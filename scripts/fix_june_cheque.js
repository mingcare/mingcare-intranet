const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

/*
  June 2025 Cheque Account 修正腳本
  
  Bank Statement:
  - Opening: $3,420.54
  - Closing: $5,187.04
  
  需要修正:
  1. 修改支票交易日期（改為銀行兌現日期）
  2. 新增內部轉賬記錄（從儲蓄戶口轉入支票戶口）
  3. 新增支票#32記錄
  4. 將不在6月statement的支票改到7月
*/

(async () => {
  console.log('=== June 2025 Cheque Account 修正 ===\n');

  // Step 1: 修改支票交易日期
  console.log('--- Step 1: 修改支票交易日期 ---');
  
  const dateUpdates = [
    { journal: '00000769', oldDate: '2025-06-01', newDate: '2025-06-02', cheque: '72', amount: 3080 },
    { journal: '00000929', oldDate: '2025-06-11', newDate: '2025-06-12', cheque: '30', amount: 488.50 },
    { journal: '00000930', oldDate: '2025-06-11', newDate: '2025-06-12', cheque: '31', amount: 400 },
    { journal: '00000892', oldDate: '2025-06-06', newDate: '2025-06-14', cheque: '27', amount: 2040 },
    { journal: '00000893', oldDate: '2025-06-06', newDate: '2025-06-16', cheque: '29', amount: 9465 },
    { journal: '00000896', oldDate: '2025-06-06', newDate: '2025-06-18', cheque: '75', amount: 5160 },
  ];

  for (const u of dateUpdates) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ transaction_date: u.newDate })
      .eq('journal_number', u.journal)
      .select('journal_number, transaction_date');
    
    if (error) {
      console.log(`❌ ${u.journal} (CHQ#${u.cheque}): Error - ${error.message}`);
    } else {
      console.log(`✓ ${u.journal} (CHQ#${u.cheque} $${u.amount}): ${u.oldDate} → ${u.newDate}`);
    }
  }

  // Step 2: 將不在6月statement的支票改到7月
  console.log('\n--- Step 2: 將不在6月statement的支票改到7月 ---');
  
  const moveToJuly = [
    { journal: '00000891', cheque: '26', amount: 4095, desc: '王紅燕 5月份工資' },
    { journal: '00000894', cheque: '73→40', amount: 220, desc: '許秀容 5月份工資' },
    { journal: '00000895', cheque: '74', amount: 220, desc: '葉影如 5月份工資' },
  ];

  for (const m of moveToJuly) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ transaction_date: '2025-07-01' })
      .eq('journal_number', m.journal)
      .select('journal_number, transaction_date');
    
    if (error) {
      console.log(`❌ ${m.journal} (CHQ#${m.cheque}): Error - ${error.message}`);
    } else {
      console.log(`✓ ${m.journal} (CHQ#${m.cheque} $${m.amount}): 移到 2025-07-01 (待7月statement確認)`);
    }
  }

  // Step 3: 取得下一個流水號
  console.log('\n--- Step 3: 新增內部轉賬及支票記錄 ---');
  
  const { data: seqData } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single();
  
  let nextNum = (seqData?.last_number || 1832) + 1;
  console.log('Starting journal number:', nextNum);

  // 新增記錄
  const newRecords = [
    // 內部轉賬入支票戶口 (income)
    {
      journal_number: String(nextNum++).padStart(8, '0'),
      fiscal_year: 2025,
      billing_month: '2025年6月',
      transaction_date: '2025-06-06',
      transaction_item: '內部轉賬：儲蓄戶口轉入支票戶口',
      payment_method: '銀行轉賬',
      income_category: '內部轉帳',
      income_amount: 21500,
      expense_category: null,
      expense_amount: 0,
      handler: 'Joe Cheung',
      deduct_from_petty_cash: true,
      notes: 'CR EBICT50606108407',
    },
    {
      journal_number: String(nextNum++).padStart(8, '0'),
      fiscal_year: 2025,
      billing_month: '2025年6月',
      transaction_date: '2025-06-11',
      transaction_item: '內部轉賬：儲蓄戶口轉入支票戶口',
      payment_method: '銀行轉賬',
      income_category: '內部轉帳',
      income_amount: 1000,
      expense_category: null,
      expense_amount: 0,
      handler: 'Joe Cheung',
      deduct_from_petty_cash: true,
      notes: 'CR EBICT50611116615',
    },
    {
      journal_number: String(nextNum++).padStart(8, '0'),
      fiscal_year: 2025,
      billing_month: '2025年6月',
      transaction_date: '2025-06-27',
      transaction_item: '內部轉賬：儲蓄戶口轉入支票戶口',
      payment_method: '銀行轉賬',
      income_category: '內部轉帳',
      income_amount: 50000,
      expense_category: null,
      expense_amount: 0,
      handler: 'Joe Cheung',
      deduct_from_petty_cash: true,
      notes: 'CR EBICT50627147485',
    },
    // 支票#32 支出
    {
      journal_number: String(nextNum++).padStart(8, '0'),
      fiscal_year: 2025,
      billing_month: '2025年6月',
      transaction_date: '2025-06-27',
      transaction_item: '支票提取',
      payment_method: '支票',
      income_category: null,
      income_amount: 0,
      expense_category: '內部轉帳',
      expense_amount: 50000,
      handler: 'Joe Cheung',
      deduct_from_petty_cash: true,
      notes: '支票No.32',
    },
  ];

  for (const rec of newRecords) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(rec)
      .select('journal_number, transaction_date, income_amount, expense_amount');
    
    if (error) {
      console.log(`❌ ${rec.journal_number}: Error - ${error.message}`);
    } else {
      const amt = rec.income_amount > 0 ? `+$${rec.income_amount}` : `-$${rec.expense_amount}`;
      console.log(`✓ ${rec.journal_number}: ${rec.transaction_date} ${amt} - ${rec.transaction_item}`);
    }
  }

  // 更新流水號序列
  await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNum - 1 })
    .eq('id', 1);
  
  console.log('\n✓ Updated journal sequence to:', nextNum - 1);

  // Step 4: 驗證結果
  console.log('\n--- Step 4: 驗證結果 ---');
  
  const { data: juneCheque } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('payment_method.eq.支票,income_category.eq.內部轉帳')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .eq('deduct_from_petty_cash', true)
    .order('transaction_date')
    .order('journal_number');

  let totalIn = 0, totalOut = 0;
  console.log('\nJune 2025 Cheque Account Transactions:');
  juneCheque?.forEach(t => {
    const inc = parseFloat(t.income_amount) || 0;
    const exp = parseFloat(t.expense_amount) || 0;
    totalIn += inc;
    totalOut += exp;
    const amt = inc > 0 ? `+$${inc.toFixed(2)}` : `-$${exp.toFixed(2)}`;
    console.log(`${t.transaction_date} | ${t.journal_number} | ${amt.padStart(12)} | ${(t.transaction_item || '').substring(0, 35)}`);
  });

  const opening = 3420.54;
  const closing = opening + totalIn - totalOut;
  
  console.log('\n--- Summary ---');
  console.log('Opening Balance: $' + opening.toFixed(2));
  console.log('Total Income:   +$' + totalIn.toFixed(2));
  console.log('Total Expense:  -$' + totalOut.toFixed(2));
  console.log('Closing Balance: $' + closing.toFixed(2));
  console.log('Expected:        $5,187.04');
  console.log(closing.toFixed(2) === '5187.04' ? '\n✅ MATCH!' : '\n❌ MISMATCH');
})();
