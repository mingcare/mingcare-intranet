const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTUzNzcsImV4cCI6MjA1MDE3MTM3N30.l470wDnAWPOp3TJaV4tqn6x6fTcfggLdsvA3dLcbtZg'
);

async function check() {
  // 查看 1698 相關記錄
  const { data: r1698, error: e1 } = await supabase
    .from('financial_transactions')
    .select('*')
    .like('journal_number', '%1698%');
  if (e1) console.log('錯誤:', e1);
  console.log('1698 相關記錄:', r1698);
  
  // 查看最新的記錄
  const { data: latest, error: e2 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income, expense, remark')
    .order('transaction_date', { ascending: false })
    .limit(30);
  if (e2) console.log('錯誤:', e2);
  console.log('\n最近的記錄:');
  if (latest) latest.forEach(p => console.log(p.journal_number, p.transaction_date, p.transaction_item, '收入:', p.income, '支出:', p.expense));

  // 查看 2026 年的記錄
  const { data: y2026, error: e3 } = await supabase
    .from('financial_transactions')
    .select('journal_number, transaction_date, transaction_item, income, expense, remark')
    .gte('transaction_date', '2026-01-01')
    .order('transaction_date', { ascending: false });
  if (e3) console.log('錯誤:', e3);
  if (y2026) {
    console.log('\n2026年所有記錄 (' + y2026.length + '筆):');
    y2026.forEach(r => console.log(r.journal_number, r.transaction_date, r.transaction_item, '收入:', r.income, '支出:', r.expense));
  }
}

check();
