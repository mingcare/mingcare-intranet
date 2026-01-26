#!/usr/bin/env python3
"""
財務交易數據導入腳本 v2
支持多種CSV格式，包括序號在第一列或第二列的情況
"""

import os
import re
import csv
from datetime import datetime
from supabase import create_client, Client

# Supabase 配置
supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
supabase_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
supabase: Client = create_client(supabase_url, supabase_key)

# CSV 文件路徑
csv_file_path = '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表.csv'

def clean_amount(amount_str):
    """清理金額字符串，轉換為數字"""
    if not amount_str or amount_str.strip() == '':
        return 0.0
    
    # 移除 $, 逗號, 空格, 換行符等
    cleaned = re.sub(r'[$,\s\n\r]', '', amount_str)
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def clean_text(text):
    """清理文本字段"""
    if not text:
        return None
    cleaned = ' '.join(text.strip().split())
    return cleaned if cleaned else None

def parse_date(date_str):
    """解析日期"""
    if not date_str:
        return None
    
    date_str = date_str.strip()
    
    # 處理格式: 2024/5/2 或 2024/05/02
    match = re.match(r'(\d{4})/(\d{1,2})/(\d{1,2})', date_str)
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))
        try:
            return datetime(year, month, day).strftime('%Y-%m-%d')
        except ValueError:
            return None
    
    return None

def extract_fiscal_year(billing_month):
    """提取財政年份"""
    if not billing_month:
        return None
    match = re.search(r'(\d{4})年', billing_month)
    return int(match.group(1)) if match else None

def import_csv():
    print('🚀 開始導入財務數據 v2...')
    print(f'📁 CSV文件: {csv_file_path}')
    
    transactions = []
    row_count = 0
    skipped_rows = 0
    
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for row in reader:
            row_count += 1
            
            # 跳過空行
            if not row or all(cell.strip() == '' for cell in row):
                skipped_rows += 1
                continue
            
            # 確保至少有13列
            while len(row) < 14:
                row.append('')
            
            # 判斷格式：第一列是序號還是空的
            # 格式1: 序號在第一列 (2024-05-001, 2, 2024年5月, ...)
            # 格式2: 第一列空，序號在第二列 (,717,2025年1月, ...)
            
            if row[0].strip() and re.match(r'^\d{4}-\d{2}-\d{3}$', row[0].strip()):
                # 格式1: 序號在第一列
                transaction_code = clean_text(row[0])
                seq_num = clean_text(row[1])
                billing_month = clean_text(row[2])
                transaction_date = parse_date(row[3])
                transaction_item = clean_text(row[4])
                payment_method = clean_text(row[5])
                income_category = clean_text(row[6])
                expense_category = clean_text(row[7])
                income_amount = clean_amount(row[8])
                expense_amount = clean_amount(row[9])
                petty_cash = clean_amount(row[10])
                handler = clean_text(row[11])
                reimbursement_status = clean_text(row[12])
            elif row[1].strip() and re.match(r'^\d+$', row[1].strip()):
                # 格式2: 第一列空，序號在第二列
                seq_num = clean_text(row[1])
                billing_month = clean_text(row[2])
                transaction_date = parse_date(row[3])
                transaction_item = clean_text(row[4])
                payment_method = clean_text(row[5])
                income_category = clean_text(row[6])
                expense_category = clean_text(row[7])
                income_amount = clean_amount(row[8])
                expense_amount = clean_amount(row[9])
                petty_cash = clean_amount(row[10])
                handler = clean_text(row[11])
                reimbursement_status = clean_text(row[12])
                
                # 從billing_month生成transaction_code
                if billing_month and seq_num:
                    year_match = re.search(r'(\d{4})年(\d{1,2})月', billing_month)
                    if year_match:
                        year = year_match.group(1)
                        month = year_match.group(2).zfill(2)
                        transaction_code = f"{year}-{month}-{seq_num.zfill(3)}"
                    else:
                        transaction_code = f"TXN-{seq_num.zfill(6)}"
                else:
                    transaction_code = None
            else:
                # 跳過標題行或無效行
                skipped_rows += 1
                continue
            
            # 驗證必填字段
            if not transaction_date or not transaction_item:
                skipped_rows += 1
                continue
            
            # 跳過標題行
            if transaction_item in ['交易項目', '序號']:
                skipped_rows += 1
                continue
            
            fiscal_year = extract_fiscal_year(billing_month)
            
            # 如果沒有transaction_code，生成一個唯一的
            if not transaction_code:
                transaction_code = f"AUTO-{row_count:06d}"
            
            transactions.append({
                'transaction_code': transaction_code,
                'billing_month': billing_month,
                'transaction_date': transaction_date,
                'transaction_item': transaction_item,
                'payment_method': payment_method,
                'income_category': income_category,
                'expense_category': expense_category,
                'income_amount': income_amount,
                'expense_amount': expense_amount,
                'petty_cash': petty_cash if petty_cash > 0 else None,
                'handler': handler,
                'reimbursement_status': reimbursement_status,
                'fiscal_year': fiscal_year,
            })
    
    print(f'\n📊 CSV解析完成:')
    print(f'   總行數: {row_count}')
    print(f'   有效交易: {len(transactions)}')
    print(f'   跳過行數: {skipped_rows}')
    
    if not transactions:
        print('❌ 沒有有效的交易數據')
        return
    
    # 先清空現有數據
    print('\n🗑️ 清空現有數據...')
    try:
        supabase.table('financial_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print('   ✅ 已清空現有數據')
    except Exception as e:
        print(f'   ⚠️ 清空數據時出錯: {e}')
    
    print('\n💾 開始寫入Supabase...')
    
    # 批量插入，每次100筆
    batch_size = 100
    inserted = 0
    errors = 0
    
    for i in range(0, len(transactions), batch_size):
        batch = transactions[i:i + batch_size]
        
        try:
            result = supabase.table('financial_transactions').insert(batch).execute()
            inserted += len(batch)
            print(f'✅ 批次 {i // batch_size + 1}: 已插入 {inserted}/{len(transactions)} 筆')
        except Exception as e:
            errors += len(batch)
            print(f'❌ 批次 {i // batch_size + 1} 插入失敗: {e}')
    
    print(f'\n✨ 導入完成！')
    print(f'   成功插入: {inserted} 筆')
    print(f'   失敗: {errors} 筆')
    
    # 統計摘要
    total_income = sum(t['income_amount'] for t in transactions)
    total_expense = sum(t['expense_amount'] for t in transactions)
    
    print('\n📈 財務摘要:')
    print(f'   總收入: HK${total_income:,.2f}')
    print(f'   總支出: HK${total_expense:,.2f}')
    print(f'   淨額: HK${total_income - total_expense:,.2f}')
    
    # 按年份統計
    year_stats = {}
    for t in transactions:
        year = t['fiscal_year']
        if year:
            if year not in year_stats:
                year_stats[year] = {'income': 0, 'expense': 0, 'count': 0}
            year_stats[year]['income'] += t['income_amount']
            year_stats[year]['expense'] += t['expense_amount']
            year_stats[year]['count'] += 1
    
    print('\n📅 年度統計:')
    for year in sorted(year_stats.keys()):
        stats = year_stats[year]
        print(f'   {year}年: {stats["count"]} 筆, 收入 HK${stats["income"]:,.2f}, 支出 HK${stats["expense"]:,.2f}')

if __name__ == '__main__':
    import_csv()
    print('\n🎉 所有操作完成！')
