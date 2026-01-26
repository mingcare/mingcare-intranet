#!/usr/bin/env python3
"""
明家居家護理服務 - 財務數據導入腳本 v3.0
重新設計：簡潔版本
"""

import csv
import os
import re
from datetime import datetime
from supabase import create_client

# Supabase 配置
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 錯誤：請設定環境變數 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# CSV 文件路徑
CSV_PATH = "/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表 (2).csv"


def clean_amount(value: str) -> float:
    """清理金額字串，轉換為數字"""
    if not value or value.strip() == '':
        return 0.0
    # 移除 $, 逗號, 空格
    cleaned = re.sub(r'[$,\s]', '', value.strip())
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0


def parse_date(date_str: str) -> str:
    """解析日期字串為 ISO 格式"""
    if not date_str or date_str.strip() == '':
        return None
    
    date_str = date_str.strip()
    
    # 嘗試不同的日期格式
    formats = [
        '%Y/%m/%d',
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%Y年%m月%d日',
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    return None


def extract_fiscal_year(billing_month: str, date_str: str) -> int:
    """從帳單月份或交易日期提取所屬年份"""
    # 優先從帳單月份提取
    if billing_month:
        match = re.search(r'(\d{4})', billing_month)
        if match:
            return int(match.group(1))
    
    # 從交易日期提取
    if date_str:
        match = re.search(r'(\d{4})', date_str)
        if match:
            return int(match.group(1))
    
    return datetime.now().year


def main():
    print("=" * 60)
    print("明家居家護理服務 - 財務數據導入 v3.0")
    print("=" * 60)
    
    # 讀取 CSV
    print(f"\n📂 讀取 CSV: {CSV_PATH}")
    
    records = []
    skipped = 0
    
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        # 跳過前兩行空行
        lines = f.readlines()
        
        # 找到標題行
        header_line_idx = None
        for i, line in enumerate(lines):
            if '序號' in line and '交易日期' in line:
                header_line_idx = i
                break
        
        if header_line_idx is None:
            print("❌ 找不到標題行")
            return
        
        # 重新讀取，跳過標題行之前的內容
        f.seek(0)
        reader = csv.DictReader(lines[header_line_idx:])
        
        for row in reader:
            # 跳過空行
            transaction_code = row.get('序號', '').strip()
            transaction_date = row.get('交易日期', '').strip()
            
            if not transaction_code or not transaction_date:
                skipped += 1
                continue
            
            # 跳過無效數據
            if transaction_code in ['', '#REF!'] or '序號' in transaction_code:
                skipped += 1
                continue
            
            # 解析日期
            parsed_date = parse_date(transaction_date)
            if not parsed_date:
                skipped += 1
                continue
            
            # 提取數據
            billing_month = row.get('帳單所屬月份', '').strip()
            fiscal_year = extract_fiscal_year(billing_month, transaction_date)
            
            income_amount = clean_amount(row.get('收入金額', ''))
            expense_amount = clean_amount(row.get('支出金額', ''))
            petty_cash = clean_amount(row.get('Petty Cash', ''))
            
            # 跳過沒有金額的記錄
            if income_amount == 0 and expense_amount == 0:
                skipped += 1
                continue
            
            record = {
                'transaction_code': transaction_code,
                'fiscal_year': fiscal_year,
                'billing_month': billing_month or f"{fiscal_year}年",
                'transaction_date': parsed_date,
                'transaction_item': row.get('交易項目', '').strip() or '未命名交易',
                'payment_method': row.get('付款方式', '').strip() or None,
                'income_category': row.get('收入項目', '').strip() or None,
                'expense_category': row.get('支出項目', '').strip() or None,
                'income_amount': income_amount,
                'expense_amount': expense_amount,
                'petty_cash': petty_cash,
                'handler': row.get('經手人', '').strip() or None,
                'reimbursement_status': row.get('申請報銷', '').strip() or None,
            }
            
            records.append(record)
    
    print(f"✅ 讀取完成: {len(records)} 筆有效記錄, {skipped} 筆跳過")
    
    if not records:
        print("❌ 沒有有效記錄")
        return
    
    # 按日期排序 (用於生成正確的流水號順序)
    records.sort(key=lambda x: x['transaction_date'])
    
    # 清空現有數據
    print("\n🗑️ 清空現有數據...")
    supabase.table('financial_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    
    # 重置流水號序列
    print("🔄 重置流水號序列...")
    supabase.table('global_journal_sequence').update({'last_number': 0}).eq('id', 1).execute()
    
    # 批量插入
    print(f"\n📤 開始導入 {len(records)} 筆記錄...")
    
    batch_size = 100
    total_imported = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = supabase.table('financial_transactions').insert(batch).execute()
            total_imported += len(batch)
            print(f"  ✅ 已導入: {total_imported}/{len(records)}")
        except Exception as e:
            print(f"  ❌ 批次 {i//batch_size + 1} 錯誤: {e}")
            # 嘗試逐筆插入
            for record in batch:
                try:
                    supabase.table('financial_transactions').insert(record).execute()
                    total_imported += 1
                except Exception as e2:
                    print(f"    ⚠️ 跳過記錄 {record['transaction_code']}: {e2}")
    
    print(f"\n{'=' * 60}")
    print(f"✅ 導入完成！共 {total_imported} 筆記錄")
    print(f"{'=' * 60}")
    
    # 統計摘要
    print("\n📊 數據摘要:")
    
    # 按年份統計
    year_stats = {}
    total_income = 0
    total_expense = 0
    
    for r in records:
        year = r['fiscal_year']
        if year not in year_stats:
            year_stats[year] = {'count': 0, 'income': 0, 'expense': 0}
        year_stats[year]['count'] += 1
        year_stats[year]['income'] += r['income_amount']
        year_stats[year]['expense'] += r['expense_amount']
        total_income += r['income_amount']
        total_expense += r['expense_amount']
    
    for year in sorted(year_stats.keys()):
        stats = year_stats[year]
        print(f"  {year}年: {stats['count']} 筆, 收入 ${stats['income']:,.2f}, 支出 ${stats['expense']:,.2f}")
    
    print(f"\n  總計: 收入 ${total_income:,.2f}, 支出 ${total_expense:,.2f}")
    print(f"  淨額: ${total_income - total_expense:,.2f}")


if __name__ == '__main__':
    main()
