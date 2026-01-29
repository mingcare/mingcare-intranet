const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
);

async function compare() {
  // 讀取 CSV
  const csvPath = '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表 (4).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // 跳過標題行，提取所有單號
  const csvRecords = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const firstComma = line.indexOf(',');
    if (firstComma > 0) {
      const journalNum = line.substring(0, firstComma).trim();
      if (journalNum && journalNum !== '序號') {
        csvRecords.push({ line: i + 1, journalNum, raw: line.substring(0, 100) });
      }
    } else if (line.startsWith(',')) {
      // 無單號的記錄
      csvRecords.push({ line: i + 1, journalNum: '(空)', raw: line.substring(0, 100) });
    }
  }
  
  console.log('CSV 記錄數（含空單號）:', csvRecords.length);
  
  // 從數據庫取得所有單號
  let dbRecords = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('financial_transactions')
      .select('journal_number, transaction_item, billing_month')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    dbRecords = dbRecords.concat(data);
    page++;
  }
  
  console.log('數據庫記錄數:', dbRecords.length);
  
  // 建立數據庫單號集合（標準化格式）
  const dbJournalSet = new Set();
  dbRecords.forEach(r => {
    if (r.journal_number) {
      dbJournalSet.add(r.journal_number);
      // 如果是8位數字格式，也加入不帶前導零的版本
      if (/^\d{8}$/.test(r.journal_number)) {
        dbJournalSet.add(String(parseInt(r.journal_number)));
      }
    }
  });
  
  // 檢查 CSV 中有哪些不在數據庫中
  const missing = [];
  const emptyJournal = [];
  
  csvRecords.forEach(r => {
    if (r.journalNum === '(空)') {
      emptyJournal.push(r);
    } else {
      // 標準化比對
      let found = dbJournalSet.has(r.journalNum);
      if (!found && /^\d+$/.test(r.journalNum)) {
        // 嘗試8位格式
        const padded = r.journalNum.padStart(8, '0');
        found = dbJournalSet.has(padded);
      }
      if (!found) {
        missing.push(r);
      }
    }
  });
  
  console.log('\n--- 分析結果 ---');
  console.log('CSV 空單號記錄:', emptyJournal.length);
  console.log('CSV 有單號但數據庫找不到:', missing.length);
  
  if (missing.length > 0) {
    console.log('\n缺失的記錄:');
    missing.forEach(r => {
      console.log(`  行 ${r.line}: [${r.journalNum}] ${r.raw.substring(r.journalNum.length + 1, 80)}...`);
    });
  }
  
  // 計算預期數量
  const csvWithJournal = csvRecords.filter(r => r.journalNum !== '(空)').length;
  console.log('\n--- 總結 ---');
  console.log('CSV 有單號記錄:', csvWithJournal);
  console.log('CSV 空單號記錄:', emptyJournal.length, '(已用 EX-xxxx 格式導入)');
  console.log('數據庫總記錄:', dbRecords.length);
  console.log('預期總數:', csvWithJournal + emptyJournal.length);
  
  if (missing.length === 0) {
    console.log('\n✅ 所有 CSV 記錄都已在數據庫中！');
  }
}

compare();
