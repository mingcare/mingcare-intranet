const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I'
);

/*
  June 2025 Savings Account 修正腳本
  
  Bank Statement: Opening $41,078.53 → Closing $70,815.21
  
  問題：
  1. 內部轉賬記錄要加支出（從儲蓄轉出到支票戶口）
  2. 缺少 FPS 手續費 $155 (31 x $5)
  3. 缺少銀行利息 $5.24
  4. 修正交易日期
*/

(async () => {
  console.log('=== June 2025 Savings Account 修正 ===\n');

  // Step 1: 修正內部轉賬記錄 - 要加支出欄位
  console.log('--- Step 1: 修正內部轉賬記錄（加支出金額）---');
  
  const internalTransferFixes = [
    { journal: '00001837', expenseAmount: 21500, date: '2025-06-06' },
    { journal: '00001838', expenseAmount: 1000, date: '2025-06-11' },
    { journal: '00001839', expenseAmount: 50000, date: '2025-06-27' },
  ];

  for (const fix of internalTransferFixes) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ 
        expense_amount: fix.expenseAmount,
        expense_category: '內部轉帳',
        income_amount: 0,
        income_category: null,
        transaction_item: '內部轉賬：儲蓄戶口轉出至支票戶口'
      })
      .eq('journal_number', fix.journal)
      .select('journal_number, expense_amount');
    
    if (error) {
      console.log(`❌ ${fix.journal}: Error - ${error.message}`);
    } else {
      console.log(`✓ ${fix.journal}: Set expense_amount = $${fix.expenseAmount}`);
    }
  }

  // Step 2: 修正交易日期 (value date vs transaction date)
  console.log('\n--- Step 2: 修正交易日期 ---');
  
  const dateUpdates = [
    { journal: '00000862', oldDate: '2025-06-01', newDate: '2025-06-02', desc: 'MC19/06 王小姐' },
    { journal: '00000863', oldDate: '2025-06-01', newDate: '2025-06-02', desc: 'MC35/04 梁小姐' },
    { journal: '00000986', oldDate: '2025-06-29', newDate: '2025-06-30', desc: 'MC54/03 余小姐' },
    { journal: '00000989', oldDate: '2025-06-29', newDate: '2025-06-30', desc: 'MC55/01 李小姐' },
    { journal: '00000960', oldDate: '2025-06-22', newDate: '2025-06-23', desc: 'Kanas 6月份工資 (value date 23)' },
  ];

  for (const u of dateUpdates) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ transaction_date: u.newDate })
      .eq('journal_number', u.journal)
      .select('journal_number, transaction_date');
    
    if (error) {
      console.log(`❌ ${u.journal}: Error - ${error.message}`);
    } else {
      console.log(`✓ ${u.journal}: ${u.oldDate} → ${u.newDate} (${u.desc})`);
    }
  }

  // Step 3: 加銀行利息
  console.log('\n--- Step 3: 加銀行利息 ---');
  
  const { data: seqData } = await supabase
    .from('global_journal_sequence')
    .select('last_number')
    .eq('id', 1)
    .single();
  
  let nextNum = (seqData?.last_number || 1840) + 1;
  
  const interestRecord = {
    journal_number: String(nextNum++).padStart(8, '0'),
    fiscal_year: 2025,
    billing_month: '2025年6月',
    transaction_date: '2025-06-30',
    transaction_item: '6月份儲蓄戶口利息',
    payment_method: '銀行轉賬',
    income_category: '銀行利息',
    income_amount: 5.24,
    expense_category: null,
    expense_amount: 0,
    handler: 'Joe Cheung',
    deduct_from_petty_cash: true,
    notes: 'Interest Posting',
  };

  const { data: intData, error: intError } = await supabase
    .from('financial_transactions')
    .insert(interestRecord)
    .select('journal_number, income_amount');
  
  if (intError) {
    console.log(`❌ Interest: Error - ${intError.message}`);
  } else {
    console.log(`✓ ${interestRecord.journal_number}: 銀行利息 +$5.24`);
  }

  // Step 4: 加 FPS 手續費
  console.log('\n--- Step 4: 加 FPS 手續費 ---');
  
  const fpsFees = [
    { date: '2025-06-04', count: 2, notes: 'FPS Fee x2 (Candy, Kyocera)' },
    { date: '2025-06-06', count: 19, notes: 'FPS Fee x19 (工資出糧)' },
    { date: '2025-06-11', count: 1, notes: 'FPS Fee x1 (Steven)' },
    { date: '2025-06-16', count: 1, notes: 'FPS Fee x1 (盧芷盈)' },
    { date: '2025-06-17', count: 1, notes: 'FPS Fee x1 (Candy)' },
    { date: '2025-06-18', count: 1, notes: 'FPS Fee x1 (政府GDN)' },
    { date: '2025-06-22', count: 1, notes: 'FPS Fee x1 (Kanas)' },
    { date: '2025-06-23', count: 1, notes: 'FPS Fee x1 (Candy)' },
    { date: '2025-06-27', count: 2, notes: 'FPS Fee x2 (Kyocera, 租金)' },
    { date: '2025-06-30', count: 3, notes: 'FPS Fee x3 (Candy, Kanas, Joe)' },
  ];

  let totalFees = 0;
  for (const fee of fpsFees) {
    const feeAmount = fee.count * 5;
    totalFees += feeAmount;
    
    const feeRecord = {
      journal_number: String(nextNum++).padStart(8, '0'),
      fiscal_year: 2025,
      billing_month: '2025年6月',
      transaction_date: fee.date,
      transaction_item: `FPS 轉帳手續費 (${fee.notes})`,
      payment_method: '銀行轉賬',
      income_category: null,
      income_amount: 0,
      expense_category: '銀行手續費',
      expense_amount: feeAmount,
      handler: 'Joe Cheung',
      deduct_from_petty_cash: true,
      notes: fee.notes,
    };

    const { error } = await supabase
      .from('financial_transactions')
      .insert(feeRecord)
      .select();
    
    if (error) {
      console.log(`❌ ${fee.date}: Error - ${error.message}`);
    } else {
      console.log(`✓ ${feeRecord.journal_number}: ${fee.date} FPS Fee -$${feeAmount}`);
    }
  }
  console.log(`Total FPS Fees: $${totalFees}`);

  // 更新流水號序列
  await supabase
    .from('global_journal_sequence')
    .update({ last_number: nextNum - 1 })
    .eq('id', 1);
  
  console.log('\n✓ Updated journal sequence to:', nextNum - 1);

  // Step 5: 驗證結果
  console.log('\n--- Step 5: 驗證結果 ---');
  
  const { data: juneSavings } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('deduct_from_petty_cash', true)
    .neq('payment_method', '支票')
    .gte('transaction_date', '2025-06-01')
    .lte('transaction_date', '2025-06-30')
    .eq('is_deleted', false)
    .order('transaction_date')
    .order('journal_number');

  let totalIn = 0, totalOut = 0;
  
  juneSavings?.forEach(t => {
    const inc = parseFloat(t.income_amount) || 0;
    const exp = parseFloat(t.expense_amount) || 0;
    totalIn += inc;
    totalOut += exp;
  });

  const opening = 41078.53;
  const closing = opening + totalIn - totalOut;
  
  console.log('\n--- Summary ---');
  console.log('Opening Balance: $' + opening.toFixed(2));
  console.log('Total Income:   +$' + totalIn.toFixed(2));
  console.log('Total Expense:  -$' + totalOut.toFixed(2));
  console.log('Net Change:      $' + (totalIn - totalOut).toFixed(2));
  console.log('Closing Balance: $' + closing.toFixed(2));
  console.log('Expected:        $70,815.21');
  
  const diff = Math.abs(closing - 70815.21);
  console.log('\nDifference: $' + diff.toFixed(2));
  console.log(diff < 1 ? '✅ MATCH!' : '❌ MISMATCH - needs further investigation');
})();
