const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTk3NzgsImV4cCI6MjA1NDgzNTc3OH0.7jnvq_M8Gg-RCmDGLqH08H95pKuLB94gLj2xL1H3dQ4'
);

// 標準化單號格式：將數字補零到8位，特殊格式保持不變
function normalizeJournalNumber(jn) {
  if (!jn || jn.toString().trim() === '') return null;
  const str = jn.toString().trim();
  
  // 如果是純數字，補零到8位
  if (/^\d+$/.test(str)) {
    return str.padStart(8, '0');
  }
  
  // 特殊格式保持原樣（EX-, R, 帶括號或字母的）
  return str;
}

async function compareCSVandDB() {
  // 讀取 CSV
  const csvPath = '/Users/joecheung/Desktop/財務紀錄 2024-2026.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  // 跳過前3行header，從第4行開始是數據
  const dataLines = lines.slice(3).filter(line => line.trim() !== '');
  
  // 解析 CSV 單號 (Column C = index 2)
  const csvJournalNumbers = new Set();
  const csvRecords = [];
  let noJournalCount = 0;
  
  for (const line of dataLines) {
    // 使用正則表達式處理 CSV（處理引號內的逗號）
    const matches = line.match(/("([^"]*)"|[^,]*)(,|$)/g);
    if (matches && matches.length > 2) {
      let journalNumber = matches[2].replace(/,$/,'').replace(/^"|"$/g, '').trim();
      
      if (journalNumber === '') {
        noJournalCount++;
      } else {
        const normalized = normalizeJournalNumber(journalNumber);
        csvJournalNumbers.add(normalized);
        csvRecords.push({ original: journalNumber, normalized });
      }
    }
  }
  
  console.log(`CSV 統計:`);
  console.log(`  有單號記錄: ${csvJournalNumbers.size}`);
  console.log(`  無單號記錄: ${noJournalCount}`);
  console.log(`  總計: ${csvJournalNumbers.size + noJournalCount}`);
  
  // 獲取數據庫所有單號
  let allDbRecords = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('journal_number')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allDbRecords = allDbRecords.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  
  const dbJournalNumbers = new Set(
    allDbRecords.map(r => r.journal_number).filter(jn => jn && !jn.startsWith('EX-'))
  );
  const dbEXCount = allDbRecords.filter(r => r.journal_number && r.journal_number.startsWith('EX-')).length;
  
  console.log(`\n數據庫統計:`);
  console.log(`  總記錄: ${allDbRecords.length}`);
  console.log(`  普通單號: ${dbJournalNumbers.size}`);
  console.log(`  EX系列: ${dbEXCount}`);
  
  // 比較
  const inCSVnotDB = [];
  for (const normalized of csvJournalNumbers) {
    if (!dbJournalNumbers.has(normalized)) {
      // 找回原始格式
      const record = csvRecords.find(r => r.normalized === normalized);
      inCSVnotDB.push({ original: record?.original, normalized });
    }
  }
  
  const inDBnotCSV = [];
  for (const jn of dbJournalNumbers) {
    if (!csvJournalNumbers.has(jn)) {
      inDBnotCSV.push(jn);
    }
  }
  
  console.log(`\n差異分析:`);
  console.log(`  CSV有但DB沒有: ${inCSVnotDB.length}`);
  if (inCSVnotDB.length > 0) {
    console.log(`  缺失的單號:`);
    for (const item of inCSVnotDB) {
      console.log(`    - ${item.original} (normalized: ${item.normalized})`);
    }
  }
  
  console.log(`\n  DB有但CSV沒有: ${inDBnotCSV.length}`);
  if (inDBnotCSV.length > 0 && inDBnotCSV.length <= 20) {
    console.log(`  額外的單號: ${inDBnotCSV.join(', ')}`);
  }
  
  console.log(`\n無單號記錄檢查:`);
  console.log(`  CSV中無單號記錄數: ${noJournalCount}`);
  console.log(`  DB中 EX 系列數量: ${dbEXCount}`);
  if (noJournalCount === dbEXCount) {
    console.log(`  ✅ 無單號記錄數量匹配！`);
  } else {
    console.log(`  ❌ 數量不匹配！差異: ${Math.abs(noJournalCount - dbEXCount)}`);
  }
  
  // 最終結論
  console.log(`\n========== 最終結論 ==========`);
  if (inCSVnotDB.length === 0 && noJournalCount === dbEXCount) {
    console.log(`✅ 所有 CSV 記錄都已導入數據庫！`);
  } else {
    console.log(`❌ 仍有記錄需要處理`);
  }
}

compareCSVandDB().catch(console.error);
