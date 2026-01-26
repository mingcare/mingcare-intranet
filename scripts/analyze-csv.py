#!/usr/bin/env python3
"""分析CSV數據結構"""

import csv
from collections import Counter

csv_path = '/Users/joecheung/Downloads/明家居家護理服務-財務報表 - 副本 - 明家居家護理服務-財務報表 (1).csv'

income_cats = Counter()
expense_cats = Counter()
payment_methods = Counter()
handlers = Counter()
petty_cash_records = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if i < 3 or len(row) < 10:
            continue
        
        income_cat = row[6].strip() if len(row) > 6 else ''
        expense_cat = row[7].strip() if len(row) > 7 else ''
        payment = row[5].strip() if len(row) > 5 else ''
        handler = row[11].strip() if len(row) > 11 else ''
        petty_cash = row[10].strip() if len(row) > 10 else ''
        
        if income_cat:
            income_cats[income_cat] += 1
        if expense_cat:
            expense_cats[expense_cat] += 1
        if payment:
            payment_methods[payment] += 1
        if handler:
            handlers[handler] += 1
        if petty_cash and petty_cash != '':
            petty_cash_records.append({
                'date': row[3],
                'item': row[4],
                'amount': petty_cash
            })

print('=== 收入類別 ===')
for cat, count in income_cats.most_common(20):
    print(f'  {count:4d} | {cat}')

print('\n=== 支出類別 ===')
for cat, count in expense_cats.most_common(30):
    print(f'  {count:4d} | {cat}')

print('\n=== 付款方式 ===')
for method, count in payment_methods.most_common():
    print(f'  {count:4d} | {method}')

print('\n=== 經手人 ===')
for h, count in handlers.most_common():
    print(f'  {count:4d} | {h}')

print(f'\n=== Petty Cash 記錄 ({len(petty_cash_records)} 筆) ===')
for rec in petty_cash_records[:20]:
    print(f"  {rec['date']} | {rec['item'][:30]} | {rec['amount']}")
