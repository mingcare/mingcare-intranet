#!/usr/bin/env python3
"""
財務交易數據導入腳本 (Python版本)
用於將CSV財務報表數據導入到Supabase
"""

import csv
import os
import sys
from datetime import datetime
from supabase import create_client, Client

# Supabase 配置
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

def clean_amount(amount_str):
    """清理金額字符串，轉換為數字"""
    if not amount_str or not amount_str.strip():
        return 0
    
    # 移除 $, 逗號, 空格, 換行符等
    cleaned = (amount_str
               .replace('$', '')
               .replace(',', '')
               .replace(' ', '')
               .replace('\n', '')
               .strip())
    
    try:
        amount = float(cleaned)
        return amount if amount != 0 else 0
    except (ValueError, TypeError):
        return 0

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
    
    # 處理格式: 2024/5/2
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            year = int(parts[0])
            month = int(parts[1])
            day = int(parts[2])
            date_obj = datetime(year, month, day)
            return date_obj.strftime('%Y-%m-%d')
    except (ValueError, IndexError):
        pass
    
    return None

def extract_fiscal_year(billing_month):
    """提取財政年份"""
    if not billing_month:
        return None
    
    import re
    match = re.search(r'(\d{4})年', billing_month)
    return int(match.group(1)) if match else None

def import_csv(csv_file_path):
    """主要導入函數"""
    print('🚀 開始導入財務數據...')
    print(f'📁 CSV文件: {csv_file_path}')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print('❌ 請設置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 環境變量')
        return
    
    # 創建 Supabase 客戶端
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    transactions = []
    row_count = 0
    skipped_rows = 0
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        
        for row in reader:
            row_count += 1
            
            # 跳過前3行（標題行）
            if row_count <= 3:
                continue
            
            # 如果沒有序號，跳過這行
            if not row[0] or not row[0].strip():
                skipped_rows += 1
                continue
            
            try:
                transaction_code = clean_text(row[0]) if len(row) > 0 else None
                billing_month = clean_text(row[2]) if len(row) > 2 else None
                transaction_date = parse_date(row[3]) if len(row) > 3 else None
                transaction_item = clean_text(row[4]) if len(row) > 4 else None
                payment_method = clean_text(row[5]) if len(row) > 5 else None
                income_category = clean_text(row[6]) if len(row) > 6 else None
                expense_category = clean_text(row[7]) if len(row) > 7 else None
                income_amount = clean_amount(row[8]) if len(row) > 8 else 0
                expense_amount = clean_amount(row[9]) if len(row) > 9 else 0
                petty_cash = clean_amount(row[10]) if len(row) > 10 else 0
                handler = clean_text(row[11]) if len(row) > 11 else None
                reimbursement_status = clean_text(row[12]) if len(row) > 12 else None
                fiscal_year = extract_fiscal_year(billing_month)
                
                # 驗證必填字段
                if not transaction_date or not transaction_item:
                    skipped_rows += 1
                    continue
                
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
            except IndexError as e:
                print(f'⚠️  行 {row_count} 解析錯誤: {e}')
                skipped_rows += 1
                continue
    
    print(f'\n📊 CSV解析完成:')
    print(f'   總行數: {row_count}')
    print(f'   有效交易: {len(transactions)}')
    print(f'   跳過行數: {skipped_rows}')
    
    if not transactions:
        print('❌ 沒有有效的交易數據')
        return
    
    try:
        print('\n💾 開始寫入Supabase...')
        
        # 批量插入，每次100筆
        batch_size = 100
        inserted = 0
        
        for i in range(0, len(transactions), batch_size):
            batch = transactions[i:i + batch_size]
            
            try:
                response = supabase.table('financial_transactions').upsert(
                    batch,
                    on_conflict='transaction_code'
                ).execute()
                
                inserted += len(batch)
                batch_num = i // batch_size + 1
                print(f'✅ 批次 {batch_num}: 已插入 {inserted}/{len(transactions)} 筆')
            except Exception as e:
                print(f'❌ 批次 {i // batch_size + 1} 插入失敗: {str(e)}')
                # 繼續處理下一批
        
        print(f'\n✨ 導入完成！共插入 {inserted} 筆交易記錄')
        
        # 統計摘要
        total_income = sum(t['income_amount'] for t in transactions)
        total_expense = sum(t['expense_amount'] for t in transactions)
        
        print('\n📈 財務摘要:')
        print(f'   總收入: HK${total_income:,.2f}')
        print(f'   總支出: HK${total_expense:,.2f}')
        print(f'   淨額: HK${(total_income - total_expense):,.2f}')
        
    except Exception as error:
        print(f'❌ 導入過程發生錯誤: {error}')
        raise

if __name__ == '__main__':
    csv_file = sys.argv[1] if len(sys.argv) > 1 else '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表.csv'
    
    try:
        import_csv(csv_file)
        print('\n🎉 所有操作完成！')
    except Exception as e:
        print(f'\n💥 導入失敗: {e}')
        sys.exit(1)
