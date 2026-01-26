#!/usr/bin/env python3
"""
財務交易數據導入腳本 v2.0
- 使用 CSV 的「序號」作為 journal_number
- 序號格式: 00000001, 00000002...
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

def format_journal_number(seq_num):
    """將序號格式化為 8 位數字"""
    try:
        num = int(seq_num)
        return str(num).zfill(8)
    except (ValueError, TypeError):
        return None

def import_csv(csv_file_path):
    """主要導入函數"""
    print('🚀 開始導入財務數據 v2.0...')
    print(f'📁 CSV文件: {csv_file_path}')
    print('📋 使用 CSV 序號作為 journal_number')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print('❌ 請設置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 環境變量')
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    transactions = []
    row_count = 0
    skipped_rows = 0
    max_seq = 0
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        
        for row in reader:
            row_count += 1
            
            # 跳過前3行（標題行）
            if row_count <= 3:
                continue
            
            # 確保有足夠的欄位
            if len(row) < 10:
                skipped_rows += 1
                continue
            
            try:
                # 第一列是序號
                seq_num = clean_text(row[0])
                
                # 解析交易日期和交易項目 (必填)
                transaction_date = parse_date(row[2])  # 第3列是交易日期
                transaction_item = clean_text(row[3])  # 第4列是交易項目
                
                # 如果沒有序號、交易日期或交易項目，跳過
                if not seq_num or not transaction_date or not transaction_item:
                    skipped_rows += 1
                    continue
                
                # 格式化 journal_number (8位數字)
                journal_number = format_journal_number(seq_num)
                if not journal_number:
                    skipped_rows += 1
                    continue
                
                # 追蹤最大序號
                try:
                    num = int(seq_num)
                    if num > max_seq:
                        max_seq = num
                except:
                    pass
                
                # 解析其他字段
                # CSV 欄位: 序號, 帳單所屬月份, 交易日期, 交易項目, 付款方式, 收入項目, 支出項目, 收入金額, 支出金額, Petty Cash, 經手人, 申請報銷
                billing_month = clean_text(row[1])
                payment_method = clean_text(row[4])
                income_category = clean_text(row[5])
                expense_category = clean_text(row[6])
                income_amount = clean_amount(row[7])
                expense_amount = clean_amount(row[8])
                # petty_cash 欄位已移除
                handler = clean_text(row[10]) if len(row) > 10 else None
                reimbursement_status = clean_text(row[11]) if len(row) > 11 else None
                fiscal_year = extract_fiscal_year(billing_month)
                
                # 根據付款方式設置 deduct_from_petty_cash
                deduct_from_petty_cash = True
                
                transactions.append({
                    'journal_number': journal_number,
                    'transaction_code': seq_num,  # 保留原始序號
                    'billing_month': billing_month,
                    'transaction_date': transaction_date,
                    'transaction_item': transaction_item,
                    'payment_method': payment_method,
                    'income_category': income_category,
                    'expense_category': expense_category,
                    'income_amount': income_amount,
                    'expense_amount': expense_amount,
                    'handler': handler,
                    'reimbursement_status': reimbursement_status,
                    'fiscal_year': fiscal_year,
                    'deduct_from_petty_cash': deduct_from_petty_cash,
                })
            except Exception as e:
                print(f'⚠️  行 {row_count} 解析錯誤: {e}')
                skipped_rows += 1
                continue
    
    print(f'\n📊 CSV解析完成:')
    print(f'   總行數: {row_count}')
    print(f'   有效交易: {len(transactions)}')
    print(f'   跳過行數: {skipped_rows}')
    print(f'   最大序號: {max_seq}')
    
    if not transactions:
        print('❌ 沒有有效的交易數據')
        return
    
    try:
        # 先清空現有數據
        print('\n🗑️  清空現有數據...')
        supabase.table('financial_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print('✅ 現有數據已清空')
        
        # 更新序號表
        print(f'\n🔢 更新序號表，設置 last_number = {max_seq}')
        supabase.table('global_journal_sequence').update({'last_number': max_seq}).eq('id', 1).execute()
        
        print('\n💾 開始寫入Supabase...')
        
        # 批量插入，每次100筆
        batch_size = 100
        inserted = 0
        
        for i in range(0, len(transactions), batch_size):
            batch = transactions[i:i + batch_size]
            
            try:
                response = supabase.table('financial_transactions').insert(batch).execute()
                
                inserted += len(batch)
                batch_num = i // batch_size + 1
                print(f'✅ 批次 {batch_num}: 已插入 {inserted}/{len(transactions)} 筆')
            except Exception as e:
                print(f'❌ 批次 {i // batch_size + 1} 插入失敗: {str(e)}')
        
        print(f'\n✨ 導入完成！共插入 {inserted} 筆交易記錄')
        print(f'📌 下一個新增交易的序號將是: {str(max_seq + 1).zfill(8)}')
        
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
    csv_file = sys.argv[1] if len(sys.argv) > 1 else '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表 (3).csv'
    
    try:
        import_csv(csv_file)
        print('\n🎉 所有操作完成！')
    except Exception as e:
        print(f'\n💥 導入失敗: {e}')
        sys.exit(1)
